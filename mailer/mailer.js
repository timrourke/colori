var path = require('path');
var mandrill = require('mandrill-api/mandrill');
var MANDRILL_API_KEY = require(path.join(__dirname, '..', 'config', 'mandrill_config'));
var mandrill_client = new mandrill.Mandrill(MANDRILL_API_KEY.mandrill_api_key);

module.exports.confirmEmail = function(user, callback){

	console.log(user);
	console.log('verification: ' + user.email_verification_uuid);

	var template_name = "colori-email-confirmation-message";
	var template_content = [{
	    }];
	var message = {
	    "subject": "Welcome to Colori, " + user.username + "! Please verify your email address.",
	    "from_email": user.email,
	    "from_name": "Colori",
	    "to": [{
	            "email": user.email,
	            "name": user.username,
	            "type": "to"
	        }],
	    "headers": {
	        "Reply-To": "tim@timrourke.com"
	    },
	    "important": false,
	    "track_opens": null,
	    "track_clicks": null,
	    "auto_text": null,
	    "auto_html": null,
	    "inline_css": null,
	    "url_strip_qs": null,
	    "preserve_recipients": null,
	    "view_content_link": null,
	    "tracking_domain": null,
	    "signing_domain": null,
	    "return_path_domain": null,
	    "merge": true,
	    "merge_language": "mailchimp",
	    "merge_vars": [{
	            "rcpt": user.email,
	            "vars": [{
	                    "name": "confirm_email_path",
	                    "content": user.email_verification_uuid
	                }]
	        }],
	    "recipient_metadata": [{
	            "rcpt": user.email,
	            "values": {
	                "user_id": user.id
	            }
	        }],
	};
	var async = false;
	mandrill_client.messages.sendTemplate({"template_name": template_name, "template_content": template_content, "message": message, "async": async}, function(result) {
	    return callback(null, result);
	    
	}, function(e) {
	    // Mandrill returns the error as an object with name and message keys
	    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	    return callback(new Error(e));
	});

};