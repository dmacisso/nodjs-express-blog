# Back-End Web Development (Tutorial for Beginners)

## by LearnWebCode

[Link to youtube tutorial](https://www.youtube.com/watch?v=1oTuMPIwHmk)

```bash
npm i ejs
npm i better-sqlite3
npm i bcrypt
npm i jsonwebtoken 
npm i dotenv
npm i cookie-parser
npm i sanitize-html
npm i marked

# create a random jwt secret key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

On 8gb-pi - Linux

```bash
sudo apt update
sudo apt install nginx
cd /var/www
cd $_
sudo touch index.html
sudo vi index.html
# <h1>Welcome to test.homelab.home</h1>

sudo mkdir test.homelab.home
sudo /var/www/test.homelab.home
sudo vi /etc/nginx/sites-available/test.homelab.home
## Or use vscode ssh plugin to edit files
sudo ln -s /etc/nginx/sites-available/test.homelab.home /etc/nginx/sites-enabled/
sudo chown -R $USER:$USER /var/www/test.homelab.home
sudo chmod -R 755 /var/www/test.homelab.home
sudo nginx -T #to check the configuration
sudo systemctl reload nginx


```

***test.homelab.home file***

```yaml
server {
  listen 80;
  server_name test.homelab.home;

  root /var/www/test.homelab.home;

  index index.html index.htm;

# First attempt to serve request as file, then
# as directory, then fall back to displaying a 404.
  location / {
    try_files $uri $uri/ =404;
  }

}
```

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d test.homelab.home
```

**NOTE:This will not work on a local domain**

**To run the node.js express server in the background.**

```bash
sudo npm install -g pm2

 $ pwd
/var/www/nodjs-express-blog

 pm2 start server.js
[PM2] Starting /var/www/nodjs-express-blog/server.js in fork_mode (1 instance)
[PM2] Done.
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ server             │ fork     │ 0    │ online    │ 0%       │ 31.9mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘

pm2 startup
 [PM2] Init System found: systemd

 [PM2] To setup the Startup Script, copy/paste the following command:

sudo env PATH=$PATH:/home/dmacisso/.nvm/versions/node/v22.12.0/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u dmacisso --hp /home/dmacisso

pm2 save
pm2 status

# To test
sudo reboot now

## Firewall Setup
sudo apt install ufw
sudo ufw --version
sudo ufw allow 22/tcp
sudo ufw allow 443/tcp 80/tcp



sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw status
sudo ufw enable
sudo ufw reload
```
