var db = require('../config/connection');

var collection = require('../config/collections');

const bcrypt = require('bcrypt');

var objectId = require('mongodb').ObjectId;

var paymentKey=require('../config/paymentKey');

const Razorpay=require('razorpay');

var instance = new Razorpay({
	key_id:paymentKey.KEY_ID,
	key_secret:paymentKey.KEY_SECRET
})

module.exports = {
	doSignup: (userData) => {
		return new Promise(async (resolve, reject) => {
			userData.Password = await bcrypt.hash(userData.Password, 10);
			db.get()
				.collection(collection.USER_COLLECTION)
				.insertOne(userData)
				.then((data) => {
					resolve(data.insertedId);
				});
		});
	},
	doLogin: (userData) => {
		return new Promise(async (resolve, reject) => {
			let loginStatus = false;
			let response = {};
			let user = await db
				.get()
				.collection(collection.USER_COLLECTION)
				.findOne({ Email: userData.Email });
			if (user) {
				bcrypt.compare(userData.Password, user.Password).then((status) => {
					if (status) {
						console.log('login success');
						response.user = user;
						response.status = true;
						resolve(response);
					} else {
						console.log('login faild');
						resolve({ status: false });
					}
				});
			} else {
				console.log('login faild');
				resolve({ status: false });
			}
		});
	},

	addToCart: (proId, userId) => {
		let proObj = {
			item: objectId(proId),
			quantity: 1,
		};
		return new Promise(async (resolve, reject) => {
			let userCart = await db
				.get()
				.collection(collection.CART_COLLECTION)
				.findOne({ user: objectId(userId) });
			if (userCart) {
				let proExist = userCart.products.findIndex(
					(product) => product.item == proId
				);
				console.log(proExist);
				if (proExist != -1) {
					db.get()
						.collection(collection.CART_COLLECTION)
						.updateOne(
							{ user: objectId(userId), 'products.item': objectId(proId) },
							{
								$inc: { 'products.$.quantity': 1 },
							}
						)
						.then(() => {
							resolve();
						});
				} else {
					db.get()
						.collection(collection.CART_COLLECTION)
						.updateOne(
							{ user: objectId(userId) },
							{
								$push: { products: proObj },
							}
						)
						.then((response) => {
							resolve();
						});
				}
			} else {
				let cartObj = {
					user: objectId(userId),
					products: [proObj],
				};
				db.get()
					.collection(collection.CART_COLLECTION)
					.insertOne(cartObj)
					.then((response) => {
						resolve();
					});
			}
		});
	},

	getCartProducts: (userId) => {
		return new Promise(async (resolve, reject) => {
			let cartItems = await db
				.get()
				.collection(collection.CART_COLLECTION)
				.aggregate([
					{
						$match: { user: objectId(userId) },
					},
					{
						$unwind: '$products',
					},
					{
						$project: {
							item: '$products.item',
							quantity: '$products.quantity',
						},
					},
					{
						$lookup: {
							from: collection.PRODUCT_COLLECTION,
							localField: 'item',
							foreignField: '_id',
							as: 'product',
						},
					},
					{
						$project: {
							item: 1,
							quantity: 1,
							product: { $arrayElemAt: ['$product', 0] },
						},
					},
					// {
					//     // $lookup:{
					//     //     from:collection.PRODUCT_COLLECTION,
					//     //     let:{proList:'$products'},
					//     //     pipeline:[
					//     //         {
					//     //             $match:{
					//     //                 $expr:{
					//     //                     $in:['$_id','$$proList']
					//     //                 }
					//     //             }
					//     //         }
					//     //     ],
					//     //     as:'cartItems'
					//     // }
					// }
				])
				.toArray();
			// console.log(cartItems);
			resolve(cartItems);
		});
	},
	getCartCount: (userId) => {
		return new Promise(async (resolve, reject) => {
			let count = 0;
			let cart = await db
				.get()
				.collection(collection.CART_COLLECTION)
				.findOne({ user: objectId(userId) });
			if (cart) {
				count = cart.products.length;
			}
			resolve(count);
		});
	},
	changeProductQuantity: (details) => {
		details.count = parseInt(details.count);
		details.quantity = parseInt(details.quantity);

		return new Promise((resolve, reject) => {
			if (details.count == -1 && details.quantity == 1) {
				db.get()
					.collection(collection.CART_COLLECTION)
					.updateOne(
						{ _id: objectId(details.cart) },
						{
							$pull: { products: { item: objectId(details.product) } }
						}
					)
					.then((response) => {
						resolve({ removeProduct: true })
					})
			} else {
				db.get()
					.collection(collection.CART_COLLECTION)
					.updateOne(
						{
							_id: objectId(details.cart),
							'products.item': objectId(details.product),
						},
						{
							$inc: { 'products.$.quantity': details.count },
						}
					)
					.then((response) => {
						// console.log(response);
						resolve({status:true});
					});
			}
		});
	},
	getTotalAmount:(userId)=>{
		return new Promise(async (resolve, reject) => {
			let total = await db
				.get()
				.collection(collection.CART_COLLECTION)
				.aggregate([
					{
						$match: { user: objectId(userId) },
					},
					{
						$unwind: '$products',
					},
					{
						$project: {
							item: '$products.item',
							quantity: '$products.quantity',
						},
					},
					{
						$lookup: {
							from: collection.PRODUCT_COLLECTION,
							localField: 'item',
							foreignField: '_id',
							as: 'product',
						},
					},
					{
						$project: {
							item: 1,
							quantity: 1,
							product: { $arrayElemAt: ['$product', 0] },
						},
					},
					{
						$group:{
							_id:null,
							total:{
								$sum:{
									$multiply:[{$toInt:'$quantity'},{$toInt:'$product.Price'}]
								}
							}
						}
					}
				])
				.toArray();
			// console.log(total[0].total);
			resolve(total[0].total);
		});
	},
	placeOrder:(order,products,total)=>{
		return new Promise((resolve, reject)=>{
			console.log(order,products,total);
			let status=order['payment-method']==='cod'?'placed':'pending'
			let orderObj={
				deliveryDetails:{
					phone:order.phone,
					address:order.address,
					pincode:order.pincode
				},
				userId:objectId(order.userId),
				paymentMethod:order['payment-method'],
				products:products,
				totalamount:total,
				status:status,
				date:new Date()
			}
			db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
				db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
				console.log("order id:",response.insertedId._id);
				resolve(response.insertedId._id)
			})
		})
	},
	getCartProductList:(userId)=>{
		return new Promise(async(resolve, reject)=>{
			let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
				resolve(cart.products)
		})
	},
	getUserOrders:(userId)=>{
		return new Promise(async(resolve, reject)=>{
			console.log(userId);
			let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
			console.log(orders);
			resolve(orders)
		})
	},
	getOrderProducts:(orderId)=>{
		return new Promise(async (resolve, reject) => {
			let orderItems = await db
				.get()
				.collection(collection.ORDER_COLLECTION)
				.aggregate([
					{
						$match: { _id: objectId(orderId) },
					},
					{
						$unwind: '$products',
					},
					{
						$project: {
							item: '$products.item',
							quantity: '$products.quantity',
						},
					},
					{
						$lookup: {
							from: collection.PRODUCT_COLLECTION,
							localField: 'item',
							foreignField: '_id',
							as: 'product',
						},
					},
					{
						$project: {
							item: 1,
							quantity: 1,
							product: { $arrayElemAt: ['$product', 0] },
						},
					},
					
				])
				.toArray();
			console.log(orderId);
			resolve(orderItems);
		});
	},
	generateRazorpay:(orderId,total)=>{
		console.log(orderId);
		return new Promise((resolve, reject)=>{
			var options = {
				amount:total,
				currency:'INR',
				receipt:'order'+orderId
			};
			instance.orders.create(options,(err,order)=>{
				console.log("order:",order);
				resolve(order);
			})
		})
	}
};
