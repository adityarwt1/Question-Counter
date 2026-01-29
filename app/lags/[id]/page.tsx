"use client"
import { LagChapterInterface, LagChapterInterfaceData } from "@/interface/lagChapter/lagchapter";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react'

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
    const [isInitialLoading, setIsInitialLoading] = useState(true)

    const fetchData = async (currentPage: number = 1, isInitial: boolean = false) => {
        if (isInitial) setIsInitialLoading(true)
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
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
        if (isInitial) setIsInitialLoading(false)
    }

    useEffect(()=>{
        fetchData(page, true)
    },[params, page])

    const handleAddChapter = async () => {
        if (!newChapterName.trim()) return
        setIsLoading(true)
        let token ;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
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
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
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
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
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
        <div className='w-full bg-primary-bg min-h-screen flex flex-col items-center p-4'>
            <div className='w-full max-w-4xl'>
                <div className='flex items-center gap-4 mb-4'>
                    <button
                        onClick={() => router.push('/lags')}
                        className='bg-button-bg text-button-text p-2 rounded hover:bg-opacity-80'
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className='text-text text-2xl font-bold'>Chapters</h1>
                </div>
                <div className='flex justify-end mb-4'>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
                    >
                        <Plus size={16} />
                        Add Chapter
                    </button>
                </div>

                {isAdding && (
                    <div className='bg-card-bg p-4 rounded mb-4'>
                        <input
                            type='text'
                            value={newChapterName}
                            onChange={(e) => setNewChapterName(e.target.value)}
                            placeholder='Enter chapter name'
                            className='w-full p-2 bg-primary-bg text-text border border-text rounded'
                        />
                        <div className='flex gap-2 mt-2'>
                            <button
                                onClick={handleAddChapter}
                                disabled={isLoading}
                                className='bg-button-bg text-button-text px-4 py-2 rounded'
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className='bg-button-bg text-button-text px-4 py-2 rounded'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className='grid gap-4'>
                    {isInitialLoading ? (
                        <div className='text-center text-text py-8'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto mb-4'></div>
                            Loading chapters...
                        </div>
                    ) : data && data.length > 0 ? (
                        data.map((chapter) => {
                            const id = typeof chapter._id == "string" ? chapter._id : chapter._id.toString()
                            return (
                                <div key={id} className='bg-card-bg p-4 rounded flex items-center justify-between cursor-pointer hover:bg-[#3a3a3a] transition-colors'>
                                    {editingId === id ? (
                                        <div className='flex-1 flex items-center gap-2'>
                                            <input
                                                type='text'
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className='flex-1 p-2 bg-primary-bg text-text border border-text rounded'
                                            />
                                            <button
                                                onClick={() => handleEditChapter(id)}
                                                disabled={isLoading}
                                                className='bg-button-bg text-button-text p-2 rounded'
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className='bg-button-bg text-button-text p-2 rounded'
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => (router as any).push(`/lags/chapter/${id}`)}
                                                className='flex-1 text-left text-text hover:text-white'
                                            >
                                                {chapter.chapterName}
                                            </button>
                                            <div className='flex gap-2'>
                                                <button
                                                    onClick={() => startEdit(id, chapter.chapterName)}
                                                    className='bg-button-bg text-button-text p-2 rounded'
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteChapter(id)}
                                                    disabled={isLoading}
                                                    className='bg-button-bg text-button-text p-2 rounded'
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className='text-center text-text py-8'>
                            <p className='mb-4'>No chapters found for this subject. Add your first chapter!</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2 mx-auto'
                            >
                                <Plus size={16} />
                                Add Your First Chapter
                            </button>
                        </div>
                    )}
                </div>

                {/* Simple pagination */}
                <div className='flex justify-center gap-2 mt-4'>
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className='bg-button-bg text-button-text px-4 py-2 rounded disabled:opacity-50'
                    >
                        Previous
                    </button>
                    <span className='text-text px-4 py-2'>Page {page}</span>
                    <button
                        onClick={() => setPage(page + 1)}
                        className='bg-button-bg text-button-text px-4 py-2 rounded'
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
export default LagChapterPage