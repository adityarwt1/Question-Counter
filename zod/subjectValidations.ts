import z from 'zod'

export const AddSubject = z.object({
    subjectName:z.string()
})