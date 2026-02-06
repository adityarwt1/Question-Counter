"use client"
import { LagResponoseData, LagResponseDataInterface } from '@/interface/Lags/lagresponse'
import { useRouter } from 'next/navigation'
import React, { Suspense, useEffect, useOptimistic, useState, useTransition } from 'react'
import { Plus, Edit2, Trash2, Save, X, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

// Skeleton Loader Component
const SubjectSkeleton = () => {
    return (
        <div className='bg-card-bg p-4 rounded flex items-center justify-between animate-pulse'>
            <div className='flex-1'>
                <div className='h-6 border-2 bg-[#252525] border-white/10 rounded-full w-3/4 '></div>
            </div>
            <div className='flex gap-2'>
                <div className='border-2 bg-[#252525] border-white/10  p-2 rounded w-9 h-9'></div>
                <div className='border-2 bg-[#252525] border-white/10 - p-2 rounded w-9 h-9'></div>
            </div>
        </div>
    )
}

// Multiple Skeleton Loaders
const SkeletonLoader = ({ count = 3 }: { count?: number }) => {
    return (
        <div className='grid gap-4'>
            {Array.from({ length: count }).map((_, index) => (
                <SubjectSkeleton key={index} />
            ))}
        </div>
    )
}

const LagPage = ()=>{
    const [lagData, setLagData] = useState<LagResponseDataInterface[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [newSubjectName, setNewSubjectName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [limit, setLimit ] = useState<number>(10)
    const [optimisticData, setOptimisticData] = useOptimistic(
        lagData,
        (state, newData: { action: 'add' | 'edit' | 'delete', item?: LagResponseDataInterface, _id?: string }) => {
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
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_LAGS}?page=${currentPage}&limit=${limit}`, {
            method:'GET',
            headers:{
                "Authorization":`Bearer ${token}`
            },
        })

        if(response.status === 401){
            return router.replace('/signin')
        }
        const responseData: LagResponoseData = await response.json()
        if(responseData.data){
        setLagData(responseData?.data)
        }
        if (isInitial) setIsInitialLoading(false)
    }

    useEffect(()=>{
        fetchData(page, true)
    },[page])

    const handleAddSubject = async () => {
        if (!newSubjectName.trim()) return
        
        // Create temporary item for optimistic update
        const tempItem: LagResponseDataInterface = {
            _id: 'temp-' + Date.now(),
            subjectName: newSubjectName
        }
        
        startTransition(async () => {
            setOptimisticData({ action: 'add', item: tempItem })
            setIsLoading(true)
            
            let token;
            if(typeof window !== "undefined"){
                token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
            }
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_LAGS as string, {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ subjectName: newSubjectName })
                })
                if (response.ok) {
                    const result = await response.json()
                    // Update with real data from server
                    setLagData(prev => [result.data, ...prev])
                    setNewSubjectName('')
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

    const handleEditSubject = async (id: string) => {
        if (!editingName.trim()) return
        
        startTransition(async () => {
            // Optimistic update
            setOptimisticData({ 
                action: 'edit', 
                item: { _id: id, subjectName: editingName } 
            })
            setIsLoading(true)
            
            let token;
            if(typeof window !== "undefined"){
                token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
            }
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_LAGS as string, {
                    method: 'PATCH',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ _id: id, subjectName: editingName })
                })
                if (response.ok) {
                    // Update with real data from server
                    setLagData(prev => prev.map(item => 
                        item._id === id ? { _id: id, subjectName: editingName } : item
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

    const handleDeleteSubject = async (id: string) => {
        startTransition(async () => {
            // Optimistic delete
            setOptimisticData({ action: 'delete', _id: id })
            setIsLoading(true)
            
            let token;
            if(typeof window !== "undefined"){
                token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
            }
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_LAGS as string, {
                    method: 'DELETE',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ _id: id })
                })
                if (response.ok) {
                    // Update real data
                    setLagData(prev => prev.filter(item => item._id !== id))
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
            handleAddSubject()
        } else if (e.key === 'Escape') {
            setIsAdding(false)
            setNewSubjectName('')
        }
    }

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
        if (e.key === 'Enter') {
            handleEditSubject(id)
        } else if (e.key === 'Escape') {
            cancelEdit()
        }
    }

    return (
        <div className='w-full bg-primary-bg min-h-screen flex flex-col items-center p-4'>
            <div className='w-full max-w-4xl'>
                <div className='flex justify-between items-center mb-4'>
                    <div className='flex items-center gap-4'>
                        <h1 className='text-text text-2xl font-bold'>Subjects</h1>
                        {isPending && (
                            <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-text'></div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
                        disabled={isPending}
                    >
                        <Plus size={16} />
                        Add Subject
                    </button>
                </div>

                {isAdding && (
                    <div className='bg-card-bg p-4 rounded mb-4'>
                        <input
                            type='text'
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            onKeyDown={handleAddKeyDown}
                            placeholder='Enter subject name (Press Enter to add, Esc to cancel)'
                            className='w-full p-2 bg-primary-bg text-text border border-text rounded'
                            disabled={isPending}
                            autoFocus
                        />
                        <div className='flex gap-2 mt-2'>
                            <button
                                onClick={handleAddSubject}
                                disabled={isLoading || isPending}
                                className='bg-button-bg text-button-text px-4 py-2 rounded disabled:opacity-50'
                            >
                                {isLoading ? "Adding...":"Add"}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false)
                                    setNewSubjectName('')
                                }}
                                className='bg-button-bg text-button-text px-4 py-2 rounded'
                                disabled={isPending}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Replace loading spinner with skeleton */}
                {isInitialLoading ? (
                    <SkeletonLoader count={5} />
                ) : (
                    <div className={`grid gap-4 ${isPending ? 'opacity-60' : ''}`}>
                        {optimisticData && optimisticData.length > 0 ? (
                            optimisticData.map((subject) => {
                                const idString = typeof subject._id === "string" ? subject._id : subject._id.toString();
                                return (
                                    <div key={idString} className='bg-card-bg p-4 rounded flex items-center justify-between cursor-pointer hover:bg-[#3a3a3a] transition-colors'>
                                        {editingId === idString ? (
                                            <div className='flex-1 flex items-center gap-2'>
                                                <input
                                                    type='text'
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyDown={(e) => handleEditKeyDown(e, idString)}
                                                    placeholder='Press Enter to save, Esc to cancel'
                                                    className='flex-1 p-2 bg-primary-bg text-text border border-text rounded'
                                                    disabled={isPending}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleEditSubject(idString)}
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
                                                    href={`/lags/${idString}`}
                                                    prefetch={true}
                                                    className='flex-1 text-left text-text hover:text-white'
                                                >
                                                    {subject.subjectName}
                                                </Link>
                                                <div className='flex gap-2'>
                                                    <button
                                                        onClick={() => startEdit(idString, subject.subjectName)}
                                                        className='bg-button-bg text-button-text p-2 rounded'
                                                        disabled={isPending}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSubject(idString)}
                                                        disabled={isLoading || isPending}
                                                        className='bg-button-bg text-button-text p-2 rounded disabled:opacity-50'
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className='text-center text-text py-8'>
                                <p className='mb-4'>No subjects found. Start by adding your first subject!</p>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2 mx-auto'
                                    disabled={isPending}
                                >
                                    <Plus size={16} />
                                    Add Your First Subject
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination & Limit Controller */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-card-bg p-3 rounded border border-gray-800'>
                    <div className='flex items-center gap-3 text-text text-sm'>
                        <span>Rows per page:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1); // Reset to page 1 when limit changes
                        }}
                            className='bg-primary-bg border border-gray-700 rounded px-2 py-1 outline-none focus:border-button-bg'
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className='flex items-center gap-4'>
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className='text-text disabled:opacity-30 hover:bg-primary-bg p-2 rounded-full transition-colors'
                        >
                            <ChevronLeft size={24} />
                        </button>
                        
                        <span className='text-text font-semibold bg-primary-bg px-4 py-1 rounded border border-gray-700'>
                            Page {page}
                        </span>

                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={lagData.length < limit}
                            className='text-text disabled:opacity-30 hover:bg-primary-bg p-2 rounded-full transition-colors'
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}


const LagPageContent = ()=>{
    return (
        <Suspense fallback={<SkeletonLoader count={5} />}>
            <LagPage></LagPage>
        </Suspense>
    )
}
export default LagPageContent;