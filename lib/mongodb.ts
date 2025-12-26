import mongoose from "mongoose";

export const connecteMongoDb = async () :Promise<boolean>=>{
    try {
        const isConnected = await mongoose.connect(process.env.MONGODB_URI as string, {
            dbName:"QuestionCounter"
        })
        if(!isConnected){
            return false
        }else return true
    } catch (error) {
        console.log(error)
        return false
    }
}