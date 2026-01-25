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
        router.push(`/lags/${id}`)
    }
    return (
        <button onClick={()=>handleNavigate(props._id as string)} className="m-4">
            {props.subjectName}
        </button>
    )
} 

export default NavigateButton