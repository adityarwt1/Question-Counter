import mongoose , {Schema, Document} from "mongoose";

interface FormulaInterface extends Document {
    chapterId:mongoose.Types.ObjectId
    src:string,
    answer:number
}

const FormulaSchema :Schema<FormulaInterface> = new Schema({
    chapterId:{
        type:Schema.Types.ObjectId,
        required:true
    },
    src:{
        type:String,
        required:true
    },
    answer:{
        type:Number,
        required:true
    }
},{
    timestamps:true
}) 

const Formula = mongoose.models.Formula || mongoose.model<FormulaInterface>("Formula", FormulaSchema)

export default Formula