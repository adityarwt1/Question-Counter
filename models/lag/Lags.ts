import mongoose , {Schema, Document}  from "mongoose";

interface LagSubjectDocument extends Document {
    userId:mongoose.Types.ObjectId
    subjectName: string
}

const LagSubjectSchema:Schema<LagSubjectDocument> = new Schema({
    subjectName:{
        type:String,
        required:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        required:true
    }
},{
    timestamps:true
})

const Lags = mongoose.models.Lags || mongoose.model<LagSubjectDocument>("Lags", LagSubjectSchema)

export default Lags;