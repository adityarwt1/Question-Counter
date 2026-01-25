"use client"
import { LagChapterInterface, LagChapterInterfaceData } from "@/interface/lagChapter/lagchapter";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

const LagChapterPage = ()=>{
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<LagChapterInterfaceData[]>()
    const [page, setPage] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [newChapterName, setNewChapterName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const fetchData = async (currentPage: number = 1) => {
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.COOKIE_NAME as string)
        }
        if(!token){
            return router.replace("/signin")
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_LAG_CHAPTER}?subjectId=${params.id}&page=${currentPage}&limit=10`,{
            method:"GET",
            headers:{
                "Authorization":`Bearer ${token}`
            }
        })
        if(response.status == 401){
            return router.replace('/signin')
        }
        const responseData :LagChapterInterface = await response.json()
        setData(responseData.data)
    }

    useEffect(()=>{
        fetchData(page)
    },[params, page])

    const handleAddChapter = async () => {
        if (!newChapterName.trim()) return
        setIsLoading(true)
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.COOKIE_NAME as string)
        }
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_CHAPTER as string, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subjectId: params.id, chapterName: newChapterName })
            })
            if (response.ok) {
                setNewChapterName('')
                setIsAdding(false)
                fetchData(page)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditChapter = async (id: string) => {
        if (!editingName.trim()) return
        setIsLoading(true)
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.COOKIE_NAME as string)
        }
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_CHAPTER as string, {
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id: id, chapterName: editingName })
            })
            if (response.ok) {
                setEditingId(null)
                setEditingName('')
                fetchData(page)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteChapter = async (id: string) => {
        setIsLoading(true)
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.COOKIE_NAME as string)
        }
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_CHAPTER as string, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id: id })
            })
            if (response.ok) {
                fetchData(page)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const startEdit = (id: string, name: string) => {
        setEditingId(id)
        setEditingName(name)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditingName('')
    }

    return (
        <div className='w-full bg-[#18181B] min-h-screen flex flex-col items-center p-4'>
            <div className='w-full max-w-4xl'>
                <div className='flex justify-between items-center mb-4'>
                    <h1 className='text-[#e0e0e0] text-2xl font-bold'>Chapters</h1>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className='bg-[#e0e0e0] text-black px-4 py-2 rounded flex items-center gap-2'
                    >
                        <Plus size={16} />
                        Add Chapter
                    </button>
                </div>

                {isAdding && (
                    <div className='bg-[#27272A] p-4 rounded mb-4'>
                        <input
                            type='text'
                            value={newChapterName}
                            onChange={(e) => setNewChapterName(e.target.value)}
                            placeholder='Enter chapter name'
                            className='w-full p-2 bg-[#18181B] text-[#e0e0e0] border border-[#e0e0e0] rounded'
                        />
                        <div className='flex gap-2 mt-2'>
                            <button
                                onClick={handleAddChapter}
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
                    {data?.map((chapter) => {
                        const id = typeof chapter._id == "string" ? chapter._id : chapter._id.toString()
                        return (
                            <div key={id} className='bg-[#27272A] p-4 rounded flex items-center justify-between'>
                                {editingId === id ? (
                                    <div className='flex-1 flex items-center gap-2'>
                                        <input
                                            type='text'
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className='flex-1 p-2 bg-[#18181B] text-[#e0e0e0] border border-[#e0e0e0] rounded'
                                        />
                                        <button
                                            onClick={() => handleEditChapter(id)}
                                            disabled={isLoading}
                                            className='bg-[#e0e0e0] text-black p-2 rounded'
                                        >
                                            <Save size={16} />
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className='bg-[#e0e0e0] text-black p-2 rounded'
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => (router as any).push(`/lags/chapter/${id}`)}
                                            className='flex-1 text-left text-[#e0e0e0] hover:text-white'
                                        >
                                            {chapter.chapterName}
                                        </button>
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={() => startEdit(id, chapter.chapterName)}
                                                className='bg-[#e0e0e0] text-black p-2 rounded'
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteChapter(id)}
                                                disabled={isLoading}
                                                className='bg-[#e0e0e0] text-black p-2 rounded'
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
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
export default LagChapterPage