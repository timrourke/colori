// User model
var bcrypt 				= require('bcryptjs'),
		uuid 					= require('uuid'),
		path					= require('path'),
		gradientUtils	= require(path.join(__dirname, '..', 'utils', 'gradientUtils'));

module.exports = function(sequelize, Sequelize) {

	var UserProfile = sequelize.define('UserProfile', {
		avatar_url: 							{ type: Sequelize.STRING, defaultValue: null },
		bio: 											{ type: Sequelize.TEXT, defaultValue: '', 
			validate: { 
				len: {
					args: [0, 6000],
					msg: 'Sorry, your bio may not exceed 6000 characters.'
				}
			}},
		website: 									{ type: Sequelize.STRING,
			validate: { 
				isUrl: {
					args: true,
					msg: 'Sorry, that does not appear to be a valid URL. Please check for errors and try again.'
				} 
			}},
		twitter_handle: 					{ type: Sequelize.STRING, defaultValue: null },
		facebook_handle: 					{ type: Sequelize.STRING,
			validate: { 
				isUrl: {
					args: true,
					msg: 'Sorry, that does not appear to be a valid URL. Please check for errors and try again.'
				} 
			}},
		github_handle: 						{ type: Sequelize.STRING,
			validate: { 
				isUrl: {
					args: true,
					msg: 'Sorry, that does not appear to be a valid URL. Please check for errors and try again.'
				} 
			}},
		dribble_handle: 					{ type: Sequelize.STRING, defaultValue: null },
		codepen_handle: 					{ type: Sequelize.STRING, defaultValue: null }
	});

	var User = sequelize.define('User', {
		username: 								{ type: Sequelize.STRING, unique: true, allowNull: false },
		password: 								{ 
			type: Sequelize.STRING, 
			validate: { min: { 
				args: 8, 
				msg: 'For your security, please choose a password of at least 8 characters in length.' }  
			}, 
			set:  function(v) {
	      var salt = bcrypt.genSaltSync(10);
	      var hash = bcrypt.hashSync(v, salt);
	      this.setDataValue('password', hash);
	    }},
		email: 										{ type: Sequelize.STRING, unique: true, allowNull: false, validate: 
			{ 
				isEmail: {
					args: true,
					msg: 'Whoops, this email does not appear to be valid. Please check it for errors and try again.'
				}
			} 
		},
		email_verified: 					{ type: Sequelize.BOOLEAN, defaultValue: false },
		email_verification_uuid: 	{ type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV4 },
		password_reset_uuid: 			{ type: Sequelize.STRING, unique: true, defaultValue: null },
		is_admin: 								{ type: Sequelize.BOOLEAN, default: false }
	}, {
		instanceMethods: {
			comparePassword: function(passw, cb) {
				bcrypt.compare(passw, this.password, function(err, isMatch) {
					if (err) {
						return cb(err);
					}
					cb(null, isMatch);
				});
			}
		}
	});

	var Gradient = sequelize.define('Gradient', {
		permalink: 								{ type: Sequelize.STRING, unique: true, allowNull: false }, 
		title: 										{ type: Sequelize.STRING, 
			validate: {
				len: {
					args: [4, 200],
					msg: 'Sorry, your gradient\'s title must be between 4 and 200 characters long.'
				}
			}
		},
		body: 										{ type: Sequelize.TEXT, allowNull: false,
			validate: {
				len: {
					args: [10, 20000],
					msg: 'Sorry, your gradient\'s CSS must be between 10 and 20000 characters long.'
				}
			}
		},
		body_autoprefixed: 				{ type: Sequelize.TEXT, allowNull: false,
			validate: {
				len: {
					args: [10, 20000],
					msg: 'Sorry, your gradient\'s CSS must be between 10 and 20000 characters long.'
				}
			}
		},
		description: 							{ type: Sequelize.TEXT, allowNull: false,
			validate: {
				len: {
					args: [0, 6000],
					msg: 'Sorry, your gradient\'s description must be under 6000 characters long.'
				}
			} 
		},
		color_stops: 							{ type: Sequelize.JSON, allowNull: false },
		angle: 										{ type: Sequelize.FLOAT, defaultValue: 0 },
		views: 										{ type: Sequelize.INTEGER, defaultValue: 0 }
	},{
		hooks: {
			beforeUpdate: function(gradient, options) {
				gradientUtils.autoprefixCss(gradient.body, function(err, autoprefixedCss){
					gradient.body_autoprefixed = autoprefixedCss;
				});
			},
			beforeValidate: function(gradient, options) {
				gradientUtils.autoprefixCss(gradient.body, function(err, autoprefixedCss){
					gradient.body_autoprefixed = autoprefixedCss;
				});
			}
		}
	});

	var Comment = sequelize.define('Comment', {
		body: 										{ type: Sequelize.TEXT, allowNull: false, 
			validate: {
				len: {
					args: [0, 2000],
					msg: 'Sorry, your comment must be under 2000 characters long.'
				}
			}
		}
	});

	var Heart = sequelize.define('Heart', {

	});

	User.hasOne(UserProfile);
	UserProfile.belongsTo(User);
	User.hasMany(Gradient);
	User.hasMany(Comment);
	UserProfile.hasMany(Comment);
	Gradient.hasMany(Comment);
	Gradient.hasMany(Heart);
	Gradient.belongsTo(User);
	Comment.belongsTo(User);
	Comment.belongsTo(Gradient);
	Comment.hasMany(Comment);
	Comment.hasMany(Heart);
	Heart.belongsTo(User);

	var Models =  {
		User: User,
		UserProfile: UserProfile,
		Gradient: Gradient,
		Comment: Comment,
		Heart: Heart
	}

	return Models;
}