FROM debian:stable

RUN apt-get update && apt-get install -y nginx \
    && rm -rf /var/lib/apt/lists/*

RUN rm -rf /var/www/html/*

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]