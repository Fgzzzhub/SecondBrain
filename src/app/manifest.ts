import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Second Brain',
    short_name: 'Brain',
    description: 'Personal Second Brain and College Management App',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: 'Add New Note',
        short_name: 'New Note',
        description: 'Create a new note in your second brain',
        url: '/notes?new=true',
        icons: [{ src: '/icon.svg', sizes: 'any' }]
      },
      {
        name: 'Add Task',
        short_name: 'Add Task',
        description: 'Add a new action item to your backlog',
        url: '/tasks',
        icons: [{ src: '/icon.svg', sizes: 'any' }]
      }
    ]
  }
}
