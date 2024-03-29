const Users = require('../models/userModel');
const Payments  = require('../models/paymentModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const userCtrl = {

register : async (req,res) =>{
    try{
     const {name , email , password} =req.body;
     const user = await Users.findOne({email})
     if(user) return res.status(400).json({msg : " the email already exist"})

     if(password.length < 6)
          return res.status(400).json({msg: " the length of password is lesss than 6"})
     
     
          //password encryption
         const passwordHash = await bcrypt.hash(password , 10)
         const newUser = new Users({
             name,email, password: passwordHash
         })
         
         
          await newUser.save();
         // then create jsonwebtoken to authentication
         const accesstoken = createAccessToken({id: newUser._id})
         const refreshtoken = createRefreshToken({id: newUser._id})  

         res.cookie('refreshtoken' , refreshtoken, {
             httpOnly: true,
             path : '/user/refresh_token',
             maxAge : 7*24*60*60*1000

         })

         res.json ({accesstoken})

    }catch(err){

        return res.status(500).json({msg : err.message})
    }

  },
refreshToken : (req,res) => {
      const rf_token = req.cookies.refreshtoken;
     try {
      if(!rf_token)  return res.status(400).json({msg : "please Login or register"})

      jwt.verify(rf_token , process.env.REFRESH_TOKEN_SECRET,(err , user)=> {
          if(err) return res.status(400).json({msg : "please Login or register"})
           const accesstoken = createAccessToken({id: user.id})
         //  res.json({rf_token})
           res.json({accesstoken})
      }) 

      //res.json({rf_token})
     }
     catch(err){
         return res.status(500).json({msg : err.message})
     }
  },
login : async (req,res)=>{
    try{
        const {email , password} =req.body;
        const user = await Users.findOne({email})
        if(!user) return res.status(400).json({msg : "User doesnot exist"});
        
        const isMatch = await bcrypt.compare(password , user.password)
        if(!isMatch) return res.status(400).json({msg: " Incorrect Password"});
        // if login success create accesstoken and refresh token
         const accesstoken = createAccessToken({id: user._id});
         const refreshtoken = createRefreshToken({id: user._id});
         
         res.cookie('refreshtoken' , refreshtoken , {
             httpOnly: true,
             path : '/user/refresh_token',
             maxAge : 7*24*60*60*1000
         })

        res.json({accesstoken});

    }
    catch(err){
        return res.status(500).json({msg : err.message})
    }
} ,

logout : async(req,res) =>{

    
    try{
         res.clearCookie('refreshtoken' , { path : '/user/refresh_token' })
         return res.json({msg:"logged out"});
            
    }
    catch(err){
        return res.status(500).json({msg : err.message})
    }

},
getUser : async(req,res) =>{
    try{
        const user = await Users.findById(req.user.id).select('-password')
        if(!user) return res.status(400).json({msg:"User does not exist"})
        res.json(user)

    }
    catch(err)
    {
        return res.status(500).json({msg : err.message})
    }
},
addCart : async(req,res) =>{
    try{
          const user = await Users.findById(req.user.id)
          if(!user) return res.status(400).json({msg:"User does not exist"})
          await Users.findOneAndUpdate({_id: req.user.id} , {
              cart:req.body.cart
          })


       return res.json({msg:"addedd to cart"})
    }catch(err)
    {
        return res.status(500).json({msg : err.message})
    }
} ,
 history : async(req,res) => {

    try{
        const history = await Payments.find({user_id : req.user.id})
        res.json(history)
       }catch(err)
       {
      return res.status(500).json({msg : err.message})
       }

}


}
 
const createAccessToken = (user) => {
    return jwt.sign(user , process.env.ACCESS_TOKEN_SECRET,{expiresIn: "11m"})
}
const createRefreshToken = (user) => {
    return jwt.sign(user , process.env.REFRESH_TOKEN_SECRET,{expiresIn: "7d"})
}
 
module.exports = userCtrl;
