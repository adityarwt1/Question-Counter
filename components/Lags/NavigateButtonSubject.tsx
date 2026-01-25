"use client"
import { useRouter } from "next/navigation"
import React from "react"

interface NavigateButtonProps {
    _id:string,
    subjectName:string
}

const NavigateButton:React.FC<NavigateButtonProps> = (props)=>{
    const router = useRouter()
    const handleNavigate = (id:string)=>{
        (router as any).push(`/lags/${id}`)
    }
    return (
        <button onClick={()=>handleNavigate(props._id as string)} className="w-full bg-card-bg text-text p-4 rounded text-left hover:bg-[#3a3a3a] cursor-pointer">
            {props.subjectName}
        </button>
    )
} 

export default NavigateButton