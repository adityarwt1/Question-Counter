import mongoose ,{Schema, Document} from "mongoose";

interface LagBodyDocument extends Document {
    lagChapterId:mongoose.Types.ObjectId;
    body:string
}

const LagBodySchema:Schema<LagBodyDocument>  = new Schema({
    lagChapterId:{
        type:Schema.Types.ObjectId,
        required:true
    }
},{
    timestamps:true
})

const LagBody = mongoose.models.LagBody || mongoose.model("LagBody", LagBodySchema)
export default LagBody;