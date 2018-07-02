# Shopify theme for The Bike Shed

This repository contains the Shopify theme created for The Bike Shed. The theme is based on the [Supply theme](https://themes.shopify.com/themes/supply/styles/blue).

## Setup

The theme has been set up to use [Slate 0.x](https://shopify.github.io/slate/) for build and deployment. For reference, fully-built versions of the theme have been committed as [/dist](https://github.com/milesw/thebikeshed/tree/master/dist) and as [theme.zip](https://github.com/milesw/thebikeshed/blob/master/upload/thebikeshed.zip).

### Slate setup

1. ```git clone git@github.com:milesw/thebikeshed.git```
2. If setting up a brand new store for testing, upload [theme.zip](https://github.com/milesw/thebikeshed/blob/master/upload/thebikeshed.zip) to your store. If setting up with the live store, duplicate the live theme first rather than overwriting the live theme.
3. Create a private app (refer to the [Slate documentation](https://shopify.github.io/slate/))
4. ```cp config.example.yml config.yml```
5. Fill in the details inside config.yml (refer to the [Slate documentation](https://shopify.github.io/slate/))
6. ```slate start -e development```

## Features

### Bike Decals

**Description**: A form on the product page allowing customers to include a personalized frame decal when purchasing a bike. 

This is implemented using line item properties on the product page. An alternate product template, product.bike.liquid, enables the form. Note that product.liquid and product.bike.liquid share the same section/settings. This was done to avoid the need to maintain two separate product templates and settings schemas.

Relevant files:
- [product.bike.liquid](https://github.com/milesw/thebikeshed/blob/master/src/templates/product.bike.liquid)
- [product-template.liquid](https://github.com/milesw/thebikeshed/blob/master/src/sections/product-template.liquid#L182)
- [bike-decals-form.js](https://github.com/milesw/thebikeshed/blob/master/src/scripts/components/bike-decal-form.js)

### Bike Builder

**Description**: A standalone page where customers are able to configure a complete bike by selecting a product for each component along with variant options. 

This is implemented as an alternate page template and a special section template. The section template uses settings/blocks to represent bike components. This allows the merchant to configure the list of components and the corresponding product collection.

Relevant files:
- [page.bike-builder.liquid](https://github.com/milesw/thebikeshed/blob/master/src/templates/page.bike-builder.liquid)
- [bike-builder.liquid](https://github.com/milesw/thebikeshed/blob/master/src/sections/bike-builder.liquid)
- [bike-builder.js](https://github.com/milesw/thebikeshed/blob/master/src/scripts/components/bike-builder.js)
