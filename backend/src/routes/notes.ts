import { Hono } from 'hono';
import { mockDb } from '../utils/mock-database';
import { authMiddleware, memberOrAdmin } from '../middleware/auth';
import { CreateNoteRequest, UpdateNoteRequest } from '../types';

const notes = new Hono();

// Apply authentication middleware to all note routes
notes.use('*', authMiddleware);
notes.use('*', memberOrAdmin);

// POST /notes - Create a note
notes.post('/', async (c) => {
  try {
    const { title, content }: CreateNoteRequest = await c.req.json();
    const userId = c.get('userId');
    const tenantId = c.get('tenantId');

    if (!title || !content) {
      return c.json({
        success: false,
        error: 'Title and content are required'
      }, 400);
    }

    // Check subscription limits
    const tenant = await mockDb.getTenantById(tenantId);
    if (!tenant) {
      return c.json({
        success: false,
        error: 'Tenant not found'
      }, 404);
    }

    // Check note limit for free plan
    if (tenant.subscription_plan === 'free') {
      const noteCount = await mockDb.countNotesByTenant(tenantId);
      if (noteCount >= 3) {
        return c.json({
          success: false,
          error: 'Note limit reached. Upgrade to Pro for unlimited notes.',
          limit_reached: true,
          current_plan: 'free',
          current_count: noteCount,
          limit: 3
        }, 403);
      }
    }

    // Create the note
    const newNote = await mockDb.createNote({
      title,
      content,
      user_id: userId,
      tenant_id: tenantId,
    });

    return c.json({
      success: true,
      data: newNote,
      message: 'Note created successfully'
    }, 201);

  } catch (error) {
    console.error('Create note error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// GET /notes - List all notes for the current tenant
notes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');

    const tenantNotes = await mockDb.getNotesByTenant(tenantId);

    return c.json({
      success: true,
      data: tenantNotes,
      count: tenantNotes.length
    });

  } catch (error) {
    console.error('List notes error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// GET /notes/:id - Retrieve a specific note
notes.get('/:id', async (c) => {
  try {
    const noteId = c.req.param('id');
    const tenantId = c.get('tenantId');

    const note = await mockDb.getNoteById(noteId);
    if (!note) {
      return c.json({
        success: false,
        error: 'Note not found'
      }, 404);
    }

    // Ensure note belongs to user's tenant
    if (note.tenant_id !== tenantId) {
      return c.json({
        success: false,
        error: 'Note not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: note
    });

  } catch (error) {
    console.error('Get note error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// PUT /notes/:id - Update a note
notes.put('/:id', async (c) => {
  try {
    const noteId = c.req.param('id');
    const tenantId = c.get('tenantId');
    const { title, content }: UpdateNoteRequest = await c.req.json();

    const existingNote = await mockDb.getNoteById(noteId);
    if (!existingNote) {
      return c.json({
        success: false,
        error: 'Note not found'
      }, 404);
    }

    // Ensure note belongs to user's tenant
    if (existingNote.tenant_id !== tenantId) {
      return c.json({
        success: false,
        error: 'Note not found'
      }, 404);
    }

    // Update the note
    const updates: Partial<typeof existingNote> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;

    const updatedNote = await mockDb.updateNote(noteId, updates);

    return c.json({
      success: true,
      data: updatedNote,
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('Update note error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// DELETE /notes/:id - Delete a note
notes.delete('/:id', async (c) => {
  try {
    const noteId = c.req.param('id');
    const tenantId = c.get('tenantId');

    const existingNote = await mockDb.getNoteById(noteId);
    if (!existingNote) {
      return c.json({
        success: false,
        error: 'Note not found'
      }, 404);
    }

    // Ensure note belongs to user's tenant
    if (existingNote.tenant_id !== tenantId) {
      return c.json({
        success: false,
        error: 'Note not found'
      }, 404);
    }

    const deleted = await mockDb.deleteNote(noteId);
    if (!deleted) {
      return c.json({
        success: false,
        error: 'Failed to delete note'
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Delete note error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

export { notes };