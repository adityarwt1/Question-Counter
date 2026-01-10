"use client"
import { useRouter } from "next/navigation";
import React, { use } from "react";
import { useEffect } from "react";

const HomePageV2 = () => {
    const router = useRouter();
    useEffect(() => {
        const fetchData = async () => {
        const token = localStorage.getItem(process.env.COOKIE_NAME as string);

        if(!token) {
            router.push("/signin");
            return;
        }

        const response = await fetch("/api/v2/questionCount",{
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            
        })
        console.log("HomePageV2 mounted");
        }
    }, []);
  return (
    <div>
        <h1>Welcome to the Home Page V2</h1>
        <p>This is the updated version of our home page.</p>
    </div>
  );
}

export default HomePageV2;