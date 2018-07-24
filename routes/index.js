var express = require('express');
var router = express.Router();
var mysql=require('mysql');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var secret="supersecret";


// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });




// mysql connection establishment
var connection=mysql.createConnection({
      host:"localhost",
      user:"root",
      password:"abhi",
      database:"concrete"

});




//connection is done once for mysql
 connection.connect(function(err){



/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next){
    console.log(res.locals);
    // getAllUserDashboardDetails(req, res, res.locals.userId);
    res.json({
      success:true
    })
    
});

//for getting signup page
// router.get('/signup', function(req, res, next){
//     res.render('signup');
// });



router.post('/checkmobile',function(req,res,next){

var contact=req.body.contact;

connection.query("select contact from driver",function(err,result,fields){
if(err) throw err;
else{
for(var i=0;i<result.length;i++)
{
    if(contact==result[i].contact)
    {
     return res.json({
      msg:'mobile number already exist'
     });
    }

}

res.json({
  success:true,
  msg:'mobile number does not exist'
})

  }

})

});



router.post('/updatemobile',function(req,res,next){

jwt.verify(req.headers.authorization, secret, function(err, decoded){
    if(err){
      console.log(req.headers.authorization)
      console.log("%%%%%%%%%%%%%%%%%%%" + err);
      res.json({
        success:false,
        msg:"some error occured"
      })
      return;
    }
    var driverId = decoded.id;



var contact=req.body.contact;

connection.query("update driver set contact='"+contact+"' where driverId='"+driverId+"'",function(err,result,fields){
if(err) throw err;
console.log("Connected from updatemobile");
})

res.json({
  success:true,
  msg:'mobile updated'
})

})
});




// api for login
router.post('/login',function(req,res,next){

 var contact=req.body.contact;
 var pin=req.body.pin;

console.log(typeof(req.body.contact));
console.log(contact);
console.log(pin);
 connection.query("select * from driver where contact='"+contact+"'",function(err,result,fields){
  if (err) {
     return handleError(err, null, res);
   }
  else{

        if(result.length<=0)
        {
        	 console.log("user with contact number: " +contact+ " does not exist");
           msg="user with contact number does not exist";
           return handleError(null,msg,res);
        }
        console.log(result[0].pin);
           
        
         bcrypt.compare(pin, result[0].pin , function(err, isMatch){
			       if(err){
                    return handleError(err, null, res);
                }
                if(!isMatch){
                    return handleError(null, "wrong password", res);
                }
                jwt.sign({id: result[0].driverId}, secret, function(err, token){
                    if(err)handleError(err, null, res);
                res.json({
                     success:true,
                     token:token

                });
            });
        }) 
     }
   })
});






//this api is for driverApp side signup
router.post('/register',function(req,res,next){

   var name=req.body.name;
   var email=req.body.email;
   var pin = req.body.pin;
   var contact=req.body.contact.slice(2-12);
   var bloodGroup=req.body.bloodgroup;


   // var contact2=req.body.contact.slice(2-12);
   // console.log(contact2);

  req.checkBody('name','Name cannot be empty').notEmpty();
  req.checkBody('email','Email cannot be empty').notEmpty();
  req.checkBody('email', 'Enter a valid email').isEmail();
  req.checkBody('pin','password cannot be empty').notEmpty();

 var errors=req.validationErrors();
 console.log(errors);
 if (errors){

 	return handleError(errors,null,res);
 }
 else{

 var newDriver= ({
       name:name,
       email:email,
       pin:pin,
       contact:contact, 
       bloodGroup:bloodGroup
 });

     
       bcrypt.hash(newDriver.pin, 10, function(err, hash){
        if(err)throw err;
        newDriver.pin = hash;


            
   var sql="Insert into Driver ( name , email , contact,pin,bloodGroup) values('"+newDriver.name+"','"+newDriver.email+"','"+newDriver.contact+"','"+newDriver.pin+"','"+newDriver.bloodGroup+"')";
   connection.query(sql,function(err,result){
      if(err) throw err;
           

           res.json({
                    success:true,
                    msg: 'user created'
                });

           });

        });
    }

})




router.get('/profile', function(req,res){

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var driverId =  decoded.id;
    
     
    console.log("Connected form profile");
    connection.query("select * from driver where driverId='"+driverId+"'",function(err,result,fields){
 
            if(err){
                return handleError(err, null, res);
            }
            res.json({
                success:true,
                user:result[0]
            });

        });
    });
});





//this route is called as POST when profile change is required
router.post('/profile', function(req, res){

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var driverId =  decoded.id;

    
        var id = driverId;
        var name = req.body.name;
        var email = req.body.email;
       // var contact = req.body.contact;

//no need to check for id
  
        req.checkBody('name', 'Name cannot be empty').notEmpty();
        req.checkBody('email', 'Email cannot be empty').notEmpty();
        //req.checkBody('contact', 'contact cannot be empty').notEmpty();
        req.checkBody('email', "Enter a valid email").isEmail();
        
        var errors = req.validationErrors();

        if(errors){
           
            return handleError(errors, null, res);
        }else{
		    
		    console.log("Connected form edit profile");
		  
			    var sql="update driver SET name='"+name+"', email='"+email+"' where driverId='"+id+"'";
			    connection.query(sql,function(err,result,fields){
			        if(err){
                        handleError(err, null, res);
                    }
                    res.json({
                        success:true,
                        user:result
                    })
                });
           
         }
     });
});



router.post('/changepass', function(req, res){
	var oldpass = req.body.oldpass;
	var newpass = req.body.newpass;
	var newpass2 = req.body.newpass2;

	jwt.verify(req.headers.authorization, secret, function(err, decoded){
		if(err){
			console.log(req.headers.authorization)
			console.log("%%%%%%%%%%%%%%%%%%%" + err);
			res.json({
				success:false,
				msg:"some error occured"
			})
			return;
		}
		var driverId = decoded.id;


    console.log("Connected from changepass");
    connection.query("select * from driver where driverId='"+driverId+"'",function(err,result,fields){



			if(err){
				handleError(err, '', res);
				return;
			}
			bcrypt.compare(oldpass, result[0].password, function(err, match) {
				if(!match){
					res.json({
						success:false,
						msg:'old password is not correct'
					});
					return;
				}
				if(newpass != newpass2){
					res.json({
						success:false,
						msg:'passwords do not match'
					});
					return;
				}
				bcrypt.hash(newpass, 10, function(err, hash){
					if(err){
						handleError(err, '', res);
						return;
					}
					result[0].password = hash;
					//user.save();
					  connection.query("update driver SET password='"+result[0].password+"' where driverId='"+driverId+"'",function(err,result,fields){
                       if(err) throw err;

                     
					res.json({
						success:true,
						msg:'password updates successfully'
					});
				});
			});
		})
	});
});
});
	






// router.post('/qrcode', function(req, res){
 

// 	jwt.verify(req.headers.authorization, secret, function(err, decoded){
// 		if(err){
// 			console.log(req.headers.authorization)
// 			console.log("%%%%%%%%%%%%%%%%%%%" + err);
// 			res.json({
// 				success:false,
// 				msg:"some error occured"
// 			})
// 			return;
// 		}
// 		var driverId = decoded.id;


// connection.query("select * from driver where driverId='"+driverId+"'",function(err,result1,fields){
// if (err) throw err;



// var totalQuantity=req.body.totalQuantity;
// var orderedQuantity=req.body.orderedQuantity;
// var quality = req.body.quality;
// var customerName=req.body.customerName;
// var supplierId=req.body.supplierId;
// var date=Date.now();

// var result=({
//     totalQuantity:totalQuantity,
//     orderedQuantity:orderedQuantity,
//     quality:quality,
//     customerName:customerName,
//     supplierId:supplierId,
//     date:date

// });

// connection.query("select * from driverdetails where contact='"+result1[0].contact+"'",function(err,result2,fields){ 
//          if(err) throw err;
//          else{
               
//                  connection.query("select * from dispatchorder where driverContact='"+result2[0].contact+"' && supplierId='"+result2[0].supplierId+"' group by dispatchId)";
//          }


// var s="totalQuantity='"+totalQuantity+"'orderedQuantity='"+orderedQuantity+"'quality='"+quality+"'customerName='"+customerName+"'supplierId='"+supplierId+"'date of dispatch='"+date+"''";


// });


// });
// });









});



//this function checks if the user is in session or not
function isAuthenticated(req, res, next){
    console.log(req.headers['authorization']);
    if(req.headers['authorization']){
        jwt.verify(req.headers['authorization'], secret, function(err, decoded){
            if(err){
                console.log(err);
                return handleError(err, null, res);
            }
            res.locals.driverId = decoded.id;
            console.log("calling next now and " + res.locals.driverId);
            return next();
        })
    }else{
        res.json({
            success:false,
            auth:false,
            msg:"authentication unsuccessful, please login again"
        });
    }
}

//this function is a general error handler
function handleError(err, msg, res){
    console.log(err);
    if(msg == undefined){
        msg = "there was some error at the server"
    }
    return res.json({
        success:false,
        msg: msg,
        err:err
    })
}











module.exports = router;
