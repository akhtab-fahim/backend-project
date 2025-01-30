//wrapepr function 
const asyncHandler = (requestHandler) => {
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err)=>next(err))

    }
}


export {asyncHandler}


//wrapepr function 

// const asyncHandler = (func) => async(req,res,next) => {
//     try {
//         await func(req,res,nexxt)
//     } catch(error) {
//         res.status(error.code).json({
//             success : false,
//             message : error.message
//         })
//     }
// }

