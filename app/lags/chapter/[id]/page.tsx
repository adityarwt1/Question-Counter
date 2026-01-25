"use client"
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

interface ChapterBody {
    _id:string
    body:string
}

const ChapterBodyPage = ()=>{
    const [data, setData] = useState<ChapterBody[]>()
    const params = useParams()
    const {id} = params
    const [page, setPage] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [newBody, setNewBody] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingBody, setEditingBody] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const fetchData = async (currentPage: number = 1) => {
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.COOKIE_NAME as string)
        }
        if(!token){
            return router.replace('/signin')
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_LAG_BODY}?lagChapterId=${id}&page=${currentPage}&limit=10`,{
            method:'GET',
            headers:{
                "Authorization":`Bearer ${token}`
            }
        })

        if(response.status === 401){
            return router.replace('/signin')
        }

        const responseData = await response.json()
        setData(responseData.data)
    }

    useEffect(()=>{
        fetchData(page)
    },[router, params, page])

    const handleAddBody = async () => {
        if (!newBody.trim()) return
        setIsLoading(true)
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.COOKIE_NAME as string)
        }
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string,{
                method:'POST',
                headers:{
                    "Authorization":`Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({_id: id, body: newBody})
            })
            if(response.ok){
                setNewBody('')
                setIsAdding(false)
                fetchData(page)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditBody = async (bodyId: string) => {
        if (!editingBody.trim()) return
        setIsLoading(true)
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.COOKIE_NAME as string)
        }
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string,{
                method:"PATCH",
                headers:{
                    "Authorization":`Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({_id: bodyId, body: editingBody})
            })
            if(response.ok){
                setEditingId(null)
                setEditingBody('')
                fetchData(page)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteBody = async (_id:string)=>{
        setIsLoading(true)
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.COOKIE_NAME as string)
        }
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string,{
                method:'DELETE',
                headers:{
                    "Authorization":`Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({_id})
            })
            if(response.ok){
                fetchData(page)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }

    const startEdit = (id: string, body: string) => {
        setEditingId(id)
        setEditingBody(body)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditingBody('')
    }

    return (
        <div className='w-full bg-[#18181B] min-h-screen flex flex-col items-center p-4'>
            <div className='w-full max-w-4xl'>
                <div className='flex justify-between items-center mb-4'>
                    <h1 className='text-[#e0e0e0] text-2xl font-bold'>Lag Points</h1>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className='bg-[#e0e0e0] text-black px-4 py-2 rounded flex items-center gap-2'
                    >
                        <Plus size={16} />
                        Add Lag Point
                    </button>
                </div>

                {isAdding && (
                    <div className='bg-[#27272A] p-4 rounded mb-4'>
                        <textarea
                            value={newBody}
                            onChange={(e) => setNewBody(e.target.value)}
                            placeholder='Enter lag point'
                            className='w-full p-2 bg-[#18181B] text-[#e0e0e0] border border-[#e0e0e0] rounded'
                            rows={4}
                        />
                        <div className='flex gap-2 mt-2'>
                            <button
                                onClick={handleAddBody}
                                disabled={isLoading}
                                className='bg-[#e0e0e0] text-black px-4 py-2 rounded'
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className='bg-[#e0e0e0] text-black px-4 py-2 rounded'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className='grid gap-4'>
                    {data?.map((item) => (
                        <div key={item._id} className='bg-[#27272A] p-4 rounded'>
                            {editingId === item._id ? (
                                <div>
                                    <textarea
                                        value={editingBody}
                                        onChange={(e) => setEditingBody(e.target.value)}
                                        className='w-full p-2 bg-[#18181B] text-[#e0e0e0] border border-[#e0e0e0] rounded'
                                        rows={4}
                                    />
                                    <div className='flex gap-2 mt-2'>
                                        <button
                                            onClick={() => handleEditBody(item._id)}
                                            disabled={isLoading}
                                            className='bg-[#e0e0e0] text-black px-4 py-2 rounded flex items-center gap-2'
                                        >
                                            <Save size={16} />
                                            Save
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className='bg-[#e0e0e0] text-black px-4 py-2 rounded flex items-center gap-2'
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className='text-[#e0e0e0] mb-2'>{item.body}</p>
                                    <div className='flex gap-2'>
                                        <button
                                            onClick={() => startEdit(item._id, item.body)}
                                            className='bg-[#e0e0e0] text-black px-4 py-2 rounded flex items-center gap-2'
                                        >
                                            <Edit2 size={16} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBody(item._id)}
                                            disabled={isLoading}
                                            className='bg-[#e0e0e0] text-black px-4 py-2 rounded flex items-center gap-2'
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Simple pagination */}
                <div className='flex justify-center gap-2 mt-4'>
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className='bg-[#e0e0e0] text-black px-4 py-2 rounded disabled:opacity-50'
                    >
                        Previous
                    </button>
                    <span className='text-[#e0e0e0] px-4 py-2'>Page {page}</span>
                    <button
                        onClick={() => setPage(page + 1)}
                        className='bg-[#e0e0e0] text-black px-4 py-2 rounded'
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChapterBodyPage