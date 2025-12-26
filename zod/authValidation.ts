import z  from 'zod'

export const signinValidaton = z.object({
    email:z.email(),
    password:z.string()
})
