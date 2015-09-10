# Colori - a CSS gradient application

Colori is a gradient generator designed for designers. CSS3 gradient syntax is a cluttered mess of numbers and punctuation, and writing gradient styles by hand feels anything but creative. Colori provides a happy path to crafting beautiful rainbows of color without clunking around with complicated code, ugly user interfaces, or confusing tool panels. The result is a browser-prefixed, syntactically correct snippet of CSS ready to drop into your project's stylesheets.

## Colori is easy

Colori's gradient builder tools are intuitive and clear. A full-screen interface with minimal, well-labeled tool panels keeps the creative process rolling. Users can build gradients anonymously or under their own user profile. Gradients can be saved, tagged, shared, hearted, and commented upon. A permalink referencing each gradient can be used to link to your work.

## Under the hood

Colori is a MEAN stack application that interacts with a custom JSON API. The interface components are built using Angular 1.4. Authentication is handled with JSON Web Tokens. Development automation is handled by Gulp.js. The project is self-hosted on a Digital Ocean droplet and served with Nginx. Websockets are used for realtime user messaging.

## Prospective Data models

See this SO article for thoughts on relational modelling for comments, tags, and likes: http://stackoverflow.com/questions/8112831/implementing-comments-and-likes-in-database

### Users

- id 											INTEGER unique
- username 								STRING unique
- password 								STRING minimum length 8 characters
- email 									STRING unique
- created 								TIMESTAMP
- modified 								TIMESTAMP defaults to null
- email_verified 					BOOLEAN defaults to false
- email_verification_path STRING
- password_reset_path 		STRING
- is_admin 								BOOLEAN defaults to false

### User profiles

- id											INTEGER unique
- user_id 								INTEGER
- avatar_url							STRING defaults to anonymous user avatar    verifies to valid URL
- bio 										TEXT																				verifies to max length < 600 characters
- twitter_handle					STRING																			verifies to valid profile URL
- facebook_handle					STRING																			verifies to valid profile URL
- github_handle						STRING																			verifies to valid profile URL
- dribble_handle					STRING																			verifies to valid profile URL
- codepen_handle					STRING																			verifies to valid profile URL

### Gradients

- id											INTEGER unique
- user_id									INTEGER defaults to anonymous user's id
- created									TIMESTAMP
- modified								TIMESTAMP defaults to null
- title 									STRING																			verifies to max length < 200 characters
- body 										TEXT																				
- body_autoprefixed				TEXT
- description							TEXT																				verifies to max length < 2000 characters
