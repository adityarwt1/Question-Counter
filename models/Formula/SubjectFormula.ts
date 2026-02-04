import mongoose , {Schema, Document} from "mongoose";

interface SubjectformulaInterface extends Document {
    subjectName:string,
    userId:mongoose.Types.ObjectId
}

const SubjectFormulaSchema : Schema<SubjectformulaInterface> = new Schema({
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

const FormulaSubject  = mongoose.models.FormulaSubject || mongoose.model<SubjectformulaInterface>("FormulaSubject", SubjectFormulaSchema)
export default FormulaSubject