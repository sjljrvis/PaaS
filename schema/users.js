'use strict';

export const UserSchema = function (app,mongoose) {
	var UserSchema = new mongoose.Schema({
		userName: String,
		email: { type: String,unique: true },
		password: { type: String },
		confirmPassword: { type: String },
		fullName: { type: String,default: "" },
		description: { type: String,default: "" },
		organization: [],
		date: {
			type: Date,
			default: Date.now()
		},
		github: {
			accessToken: { type: String,default: "" },
			id: { type: String,default: "" },
			login: { type: String,default: "" },
			nodeId: { type: String,default: "" },
			url: { type: String,default: "" },
			avatarUrl: { type: String,default: "" },
		},
		s3Token: { type: String,default: "" }
	});

	UserSchema.plugin(require('./plugins/pagedFind'));
	UserSchema.index({
		username: 1
	});

	UserSchema.set('autoIndex',(app.get('env') === 'development'));

	UserSchema.methods.validPassword = function (password) {
		return app.bcrypt.compareSync(password,this.password);
	};

	UserSchema.pre('save',function (next) {
		let user = this;
		let SALT_FACTOR = 5;
		if (!user.isModified('password')) return next();
		app.bcrypt.genSalt(SALT_FACTOR,function (err,salt) {
			if (err) {
				return next(err);
			}
			app.bcrypt.hash(user.password,salt,function (err,hash) {
				if (err) {
					return next(err);
				}
				else {
					user.password = hash;
					console.log("updating hash")
					next();
				}
			});
		});
	});

	app.db.model('User',UserSchema);

};