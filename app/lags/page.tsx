"use client"
import { LagResponoseData, LagResponseDataInterface } from '@/interface/Lags/lagresponse'
import { useRouter , } from 'next/navigation'
import React, { Suspense, useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import Link from 'next/link'

const LagPage = ()=>{
    const [lagData, setLagData] = useState<LagResponseDataInterface[]>()
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [newSubjectName, setNewSubjectName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const router = useRouter()
    const [isHover, setIsHover] = useState<string>("")
   
    const fetchData = async (currentPage: number = 1, isInitial: boolean = false) => {
        if (isInitial) setIsInitialLoading(true)
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string)
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_LAGS}?page=${currentPage}&limit=10`, {
            method:'GET',
            headers:{
                "Authorization":`Bearer ${token}`
            },

        })

        if(response.status === 401){
            return router.replace('/signin')
        }
        const responseData :LagResponoseData = await response.json()
        setLagData(responseData.data)
        if (isInitial) setIsInitialLoading(false)
        // Assuming total count is not returned, for simplicity, assume 10 pages or something. Actually, backend doesn't return total, so pagination might be limited.
        // For now, just set page.
    }

    useEffect(()=>{
        fetchData(page, true)
    },[page])

    const handleAddSubject = async () => {
        if (!newSubjectName.trim()) return
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
                setNewSubjectName('')
                setIsAdding(false)
                fetchData(page)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditSubject = async (id: string) => {
        if (!editingName.trim()) return
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

    const handleDeleteSubject = async (id: string) => {
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
                <div className='flex justify-between items-center mb-4'>
                    <h1 className='text-text text-2xl font-bold'>Subjects</h1>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className='bg-button-bg text-button-text px-4 py-2 rounded flex items-center gap-2'
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
                            placeholder='Enter subject name'
                            className='w-full p-2 bg-primary-bg text-text border border-text rounded'
                        />
                        <div className='flex gap-2 mt-2'>
                            <button
                                onClick={handleAddSubject}
                                disabled={isLoading}
                                className='bg-button-bg text-button-text px-4 py-2 rounded'
                            >
                                {isLoading ? "Adding...":"Add"}
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
                            Loading subjects...
                        </div>
                    ) : lagData && lagData.length > 0 ? (
                        lagData.map((subject) => {
                            const idString = typeof subject._id === "string" ? subject._id : subject._id.toString();
                            return (
                                <div key={idString} className='bg-card-bg p-4 rounded flex items-center justify-between cursor-pointer hover:bg-[#3a3a3a] transition-colors'>
                                    {editingId === idString ? (
                                        <div className='flex-1 flex items-center gap-2'>
                                            <input
                                                type='text'
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className='flex-1 p-2 bg-primary-bg text-text border border-text rounded'
                                            />
                                            <button
                                                onClick={() => handleEditSubject(idString)}
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
                                            <Link
                                                href={`/lags/${idString}`}
                                                prefetch={isHover === idString}
                                                onMouseEnter={()=> setIsHover(idString)}
                                                className='flex-1 text-left text-text hover:text-white'
                                            >
                                                {subject.subjectName}
                                            </Link>
                                            <div className='flex gap-2'>
                                                <button
                                                    onClick={() => startEdit(idString, subject.subjectName)}
                                                    className='bg-button-bg text-button-text p-2 rounded'
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSubject(idString)}
                                                    disabled={isLoading}
                                                    className='bg-button-bg text-button-text p-2 rounded'
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
                            >
                                <Plus size={16} />
                                Add Your First Subject
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


const LagPageContent = ()=>{
    return (
        <Suspense fallback={<><div>Loading...</div></>}>
            <LagPage></LagPage>
        </Suspense>
    )
}
export default LagPageContent;