"use client"
import { LagChapterInterface, LagChapterInterfaceData } from "@/interface/lagChapter/lagchapter";
import { useParams, useRouter } from "next/navigation";
import React, { Suspense, useEffect, useOptimistic, useState, useTransition } from "react";
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react'
import Link from "next/link";

const LagChapterPage = ()=>{
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<LagChapterInterfaceData[]>([])
    const [page, setPage] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [newChapterName, setNewChapterName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [isHover, setIsHover] = useState<string>("")
    const [isPending, startTransition] = useTransition()

    const [optimisticData, setOptimisticData] = useOptimistic(
        data,
        (state, newData: { action: 'add' | 'edit' | 'delete', item?: LagChapterInterfaceData, _id?: string }) => {
            if (newData.action === 'add' && newData.item) {
                return [newData.item, ...state]
            }
            if (newData.action === 'edit' && newData.item) {
                return state.map(item => 
                    item._id === newData.item!._id ? newData.item! : item
                )
            }
            if (newData.action === 'delete' && newData._id) {
                return state.filter(item => item._id !== newData._id)
            }
            return state
        }
    )

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
        const responseData: LagChapterInterface = await response.json()
        if(responseData.data) setData(responseData.data)
        if (isInitial) setIsInitialLoading(false)
    }

    useEffect(()=>{
        fetchData(page, true)
    },[params, page])

    const handleAddChapter = async () => {
        if (!newChapterName.trim()) return
        
        // Create temporary item for optimistic update
        const tempItem: LagChapterInterfaceData = {
            _id: 'temp-' + Date.now(),
            chapterName: newChapterName
        }
        
        startTransition(async () => {
            setOptimisticData({ action: 'add', item: tempItem })
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
                    const result = await response.json()
                    // Update with real data from server
                    setData(prev => [result.data, ...prev])
                    setNewChapterName('')
                    setIsAdding(false)
                }
            } catch (error) {
                console.error(error)
                // Revert on error
                fetchData(page)
            } finally {
                setIsLoading(false)
            }
        })
    }

    const handleEditChapter = async (id: string) => {
        if (!editingName.trim()) return
        
        startTransition(async () => {
            // Optimistic update
            setOptimisticData({ 
                action: 'edit', 
                item: { _id: id, chapterName: editingName } 
            })
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
                    // Update with real data from server
                    setData(prev => prev.map(item => 
                        item._id === id ? { _id: id, chapterName: editingName } : item
                    ))
                    setEditingId(null)
                    setEditingName('')
                }
            } catch (error) {
                console.error(error)
                // Revert on error
                fetchData(page)
            } finally {
                setIsLoading(false)
            }
        })
    }

    const handleDeleteChapter = async (id: string) => {
        startTransition(async () => {
            // Optimistic delete
            setOptimisticData({ action: 'delete', _id: id })
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
                    // Update real data
                    setData(prev => prev.filter(item => item._id !== id))
                }
            } catch (error) {
                console.error(error)
                // Revert on error
                fetchData(page)
            } finally {
                setIsLoading(false)
            }
        })
    }

    const startEdit = (id: string, name: string) => {
        setEditingId(id)
        setEditingName(name)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditingName('')
    }

    // Keyboard event handlers
    const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddChapter()
        } else if (e.key === 'Escape') {
            setIsAdding(false)
            setNewChapterName('')
        }
    }

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
        if (e.key === 'Enter') {
            handleEditChapter(id)
        } else if (e.key === 'Escape') {
            cancelEdit()
        }
    }
    
    return (
        <div className='w-full bg-primary-bg min-h-screen flex flex-col items-center p-4'>
            <div className='w-full max-w-4xl'>
                <div className='flex items-center gap-4 mb-4'>
                    <button
                        onClick={() => router.push('/lags')}
                        className='bg-button-bg text-button-text p-2 rounded hover:bg-opacity-80'
                        disabled={isPending}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className='text-text text-2xl font-bold'>Chapters</h1>
                    {isPending && (
                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-text'></div>
                    )}
                </div>
                <div className='flex justify-end mb-4'>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
                        disabled={isPending}
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
                            onKeyDown={handleAddKeyDown}
                            placeholder='Enter chapter name (Press Enter to add, Esc to cancel)'
                            className='w-full p-2 bg-primary-bg text-text border border-text rounded'
                            disabled={isPending}
                            autoFocus
                        />
                        <div className='flex gap-2 mt-2'>
                            <button
                                onClick={handleAddChapter}
                                disabled={isLoading || isPending}
                                className='bg-button-bg text-button-text px-4 py-2 rounded disabled:opacity-50'
                            >
                                {isLoading ? "Adding...":"Add"}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false)
                                    setNewChapterName('')
                                }}
                                className='bg-button-bg text-button-text px-4 py-2 rounded'
                                disabled={isPending}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className={`grid gap-4 ${isPending ? 'opacity-60' : ''}`}>
                    {isInitialLoading ? (
                        <div className='text-center text-text py-8'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto mb-4'></div>
                            Loading chapters...
                        </div>
                    ) : optimisticData && optimisticData.length > 0 ? (
                        optimisticData.map((chapter) => {
                            const id = typeof chapter._id == "string" ? chapter._id : chapter._id.toString()
                            return (
                                <div key={id} className='bg-card-bg p-4 rounded flex items-center justify-between cursor-pointer hover:bg-[#3a3a3a] transition-colors'>
                                    {editingId === id ? (
                                        <div className='flex-1 flex items-center gap-2'>
                                            <input
                                                type='text'
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => handleEditKeyDown(e, id)}
                                                placeholder='Press Enter to save, Esc to cancel'
                                                className='flex-1 p-2 bg-primary-bg text-text border border-text rounded'
                                                disabled={isPending}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleEditChapter(id)}
                                                disabled={isLoading || isPending}
                                                className='bg-button-bg text-button-text p-2 rounded disabled:opacity-50'
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className='bg-button-bg text-button-text p-2 rounded'
                                                disabled={isPending}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Link
                                                href={`/lags/chapter/${id}` as any}
                                                prefetch={isHover === id}
                                                onMouseEnter={()=> setIsHover(id)}
                                                className='flex-1 text-left text-text hover:text-white'
                                            >
                                                {chapter.chapterName}
                                            </Link>
                                            <div className='flex gap-2'>
                                                <button
                                                    onClick={() => startEdit(id, chapter.chapterName)}
                                                    className='bg-button-bg text-button-text p-2 rounded'
                                                    disabled={isPending}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteChapter(id)}
                                                    disabled={isLoading || isPending}
                                                    className='bg-button-bg text-button-text p-2 rounded disabled:opacity-50'
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
                                disabled={isPending}
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
                        disabled={page === 1 || isPending}
                        className='bg-button-bg text-button-text px-4 py-2 rounded disabled:opacity-50'
                    >
                        Previous
                    </button>
                    <span className='text-text px-4 py-2'>Page {page}</span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={isPending}
                        className='bg-button-bg text-button-text px-4 py-2 rounded disabled:opacity-50'
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}

const LagChapterPageContent = ()=>{
    return (
        <Suspense fallback={<><div>Loading...</div></>}>
            <LagChapterPage/>
        </Suspense>
    )
}
export default LagChapterPageContent