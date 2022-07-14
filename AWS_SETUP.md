# AWS EC2 SETUP

## Install Node

Install Node using these instructions:

<https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html>

## Generate SSL

Modified for AWS EC2 from:

<https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca>

- sudo amazon-linux-extras install epel -y
- sudo yum install -y certbot python2-certbot-apache
- certbot certonly --manual --preferred-chain "ISRG Root X1"
- open a new ssh session and create the file that certbot is asking for.
- Create the following folder structure.

    ```
    \server
    ----\.well-known
    --------\acme-challenge
    ------------a-string
    ----server.js
    ```

    The filename `a-string` should be the URL certbot spits out as part of the url 
    The contents of the file should be the hash it spits out

    Contents of `Server.js`
    ```
    // Dependencies
    const express = require('express');

    // Configure & Run the http server
    const app = express();

    app.use(express.static(__dirname, { dotfiles: 'allow' } ));

    app.listen(80, () => {
    console.log('HTTP server running on port 80');
    });
    ```

- Run node server.js

- Switch back to certbot ssh and finish it
- FIXTHIS: open permissions on the generated keys

    `sudo chmod 755 /etc/letsencrypt/live/eig.glowbox.io/privkey.pem`
