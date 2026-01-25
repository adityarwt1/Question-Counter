"use client"
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface ChapterBody {
    _id:string
    body:string
}
const ChapterBodyPage = ()=>{
    const [data, setData]= useState<ChapterBody[]>()
    const params = useParams()
    const {id} = params
    const [token , setToken] = useState<string>("")
    const router = useRouter()
    const [error, setError] = useState<string>("")
    const [isLoading, setIsloading] = useState(false)
    useEffect(()=>{
        let token;
        if(typeof window !== "undefined"){
            token = localStorage.getItem(process.env.COOKIE_NAME as string)
             setToken(token as string)
        }
        if(!token){
            return router.replace('/signin')
        }
        (async ()=>{
            const repsonse =await fetch(`${process.env.NEXT_PUBLIC_LAG_BODY}?lagChapterId=${id}`,{
                method:'GET',
                headers:{
                    "Authorization":`Bearer ${token}`
                }
            })

            if(repsonse.status === 401){
                return router.replace('/signin')
            }

            const responseData = await repsonse.json()
            setData(responseData.data)
        })()
    },[router, params])
    const hanldeEdit = async (_id: string, body:string)=>{
        setIsloading(true)
        if(!_id || !body){
            setError("Please edit first!")
            return 
        }
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string,{
                method:"PATCH",
                headers:{
                    "Authorization":`Bearer ${token}`
                }
            })
            if(response.status== 401 ){
                return router.replace("/signin")
            }
            const responseData = await response.json()

            if(!responseData.success){
                setError("Failed to update")
            }
            if(responseData.success){
              return  router.refresh()
            }
        } catch (error) {
            console.log(error)
            return 
        }finally{
            setIsloading(false)
        }
    }

    const handleDelete = async (_id:string)=>{
        setIsloading(true)
        if(!_id){
            return setError("Please provide id first!")
        }
        try {
            const repsonse = await fetch(process.env.NEXT_PUBLIC_LAG_BODY as string,{
                method:'DELETE',
                headers:{
                    "Authorization":`Bearer ${token}`
                },
                body:JSON.stringify({_id})
            })
            if(repsonse.status === 401){
                return router.replace("/signin")
            }
            const responseData = await repsonse.json()
            if(responseData.success){
                return router.refresh()
            }else{
                setError("Failed to delete!")
            }
        } catch (error) {
            console.log(error)
            setError("Failed to delete!")
        } finally {
            setIsloading(false)
        }
    }
    return (
        <div>hellow world</div>
    )
}

export default ChapterBodyPage