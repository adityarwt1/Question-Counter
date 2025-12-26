import mongoose, { Schema } from "mongoose";

interface UserDocument {
    email:string,
    password:string,
    token:string
}

const UserSchemaDocument :Schema<UserDocument> = new Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    token:{
        type:String,
        default:null
    }
},{timestamps:true})

const User = mongoose.models.User || mongoose.model<UserDocument>("User", UserSchemaDocument)

export default User;