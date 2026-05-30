import { createClient } from '@/lib/supabase/server'
import { AddNoteForm } from './AddNoteForm'
import { NoteCard } from './NoteCard'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-white mb-1.5">Notes</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Capture ideas, logs, and information.</p>
      </header>

      {/* Note Creation Form */}
      <div className="max-w-md">
        <AddNoteForm />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))
        ) : (
          <div className="sm:col-span-2 p-10 text-center rounded-xl border border-dashed border-neutral-900">
            <p className="text-xs text-neutral-500">Your second brain is currently empty. Write your first note!</p>
          </div>
        )}
      </div>
    </div>
  )
}
