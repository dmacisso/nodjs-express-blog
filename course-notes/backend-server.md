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

On 8gb-pi 

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
