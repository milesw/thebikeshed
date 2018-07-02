/**
 * Bike Builder component.
 *
 * Dependencies:
 * - jQuery
 * - option_selection.js
 *
 * @see sections/bike-builder.liquid
 */
theme.BikeBuilder = (function() {

  /**
   * Selector for the wrappers applied by Shopify.OptionSelectors.
   */
  var optionSelectorWrapper = '.selector-wrapper';

  /**
   * Constructor.
   *
   * This object simply manages the list of bike components and updates
   * the cart information.
   *
   * @param {object} container
   */
  function BikeBuilder(container) {
    this.container = $(container);

    this.cartTotal = this.container.find('[data-cart-total]');
    this.cartQuantity = this.container.find('[data-cart-quantity]');
    this.checkoutButton = this.container.find('[data-checkout-button]');

    this.components = this.container.find('[data-bike-component]').toArray()
      .map(function(element) {
        return new BikeComponent(element);
      });

    this.events();
  }

  BikeBuilder.prototype = $.extend({}, BikeBuilder.prototype, {

    /**
     * Event binding.
     */
    events: function() {
      // Note: These events all bubble up from the components.
      this.container.on('product-deselected variant-selected quantity-selected', this.onComponentChange.bind(this));
    },

    /**
     * Event handler.
     */
    onComponentChange: function() {
      var lineItems = this.components
        .map(function(component) {
          return component.toLineItem();
        })
        .filter(function(item) {
          return item;
        });

      // Update the item total.
      var totalItems = lineItems.reduce(function(count, item) {
        return count + parseInt(item.quantity, 10);
      }, 0);
      this.cartQuantity.empty()
        .text(totalItems === 1 ? '1 item' : totalItems + ' items');

      // Update the price.
      var totalPrice = lineItems.reduce(function(total, item) {
        return total + (item.price * item.quantity);
      }, 0);
      this.cartTotal.empty().text(Shopify.formatMoney(totalPrice * 100));

      // Update the checkout button. We use cart permalinks to pre-load
      // the cart and redirect to checkout.
      var checkoutUrl = '/cart/' + lineItems.map(function(item) {
        return item.variant + ':' + item.quantity;
      });
      this.checkoutButton.attr('href', totalItems >= 1 ? checkoutUrl : '#')
        .toggleClass('disabled', totalItems < 1);
    },
  });

  /**
   * Constructor.
   *
   * This object handles interaction with a single bike component.
   *
   * @param {object} container DOM element containing component markup.
   */
  function BikeComponent(container) {
    this.container = $(container);

    this.productSelect = this.container.find('[data-product-select]');
    this.variantSelect = this.container.find('[data-variant-select]');
    this.optionSelects = this.container.find('[data-option-selects]');
    this.quantitySelect = this.container.find('[data-quantity-select]');

    this.productOptions = this.container.find('[data-product-options]');
    this.productDetails = this.container.find('[data-product-details]');
    this.productError = this.container.find('[data-product-error]');
    this.productImage = this.productDetails.find('[data-product-image]');
    this.productPrice = this.productDetails.find('[data-product-price]');
    this.productLink = this.productDetails.find('[data-product-link]');
    this.productUnavailable = this.productDetails.find('[data-product-unavailable]');

    this.cache = {};

    this.events();
  }

  BikeComponent.prototype = $.extend({}, BikeComponent.prototype, {

    /**
     * Event binding.
     */
    events: function() {
      this.productSelect.on('change', this.onChangeProduct.bind(this));
      this.quantitySelect.on('change', this.onChangeQuantity.bind(this));
      this.container.on('product-selected', this.onProductLoaded.bind(this));
      this.container.on('product-error', this.setErrorState.bind(this));
      this.container.on('variant-selected', this.onVariantChanged.bind(this));
      this.container.on('variant-unavailable', this.setStateUnavailable.bind(this));
    },

    /**
     * Event handler.
     */
    onChangeProduct: function() {
      this.setOriginalState();

      var handle = this.productSelect.val();

      if (handle.length > 0) {
        this.loadProduct(handle);
      } else {
        this.container.trigger('product-deselected');
      }
    },

    /**
     * Event handler.
     *
     * @param {event} event Event of type product-loaded.
     */
    onProductLoaded: function(event) {
      var product = event.product;
      var container = this.container;
      var variantSelect = this.variantSelect;

      // Build new options for the variant selector.
      // Note: This is only for Shopify.OptionSelectors, it does not get
      // displayed for the user.
      $.each(product.variants, function(index, variant) {
        variantSelect.append('<option value="' + variant.id + '">' + variant.title + '</option>');
      });

      // Shopify.OptionSelectors seems to expect product.options contains an
      // array of name strings, but the AJAX API returns an array of objects
      // so we replace the options array here. Otherwise labels won't display.
      product.options = product.options.map(function(option) {
        return option.name;
      });

      // Attach single option selectors (option_selection.js must be loaded).
      // Note: onVariantSelected() gets fired immediately here.
      this.optionSelectors = new Shopify.OptionSelectors(variantSelect.attr('id'), {
        selectorClass: optionSelectorWrapper,
        product: product,
        onVariantSelected: function(variant) {
          if (variant) {
            container.trigger({
              type: 'variant-selected',
              variant: variant,
              product: product,
            });
          } else {
            container.trigger('variant-unavailable');
          }
        },
      });

      this.setLoadedState();
    },

    /**
     * Event handler.
     *
     * @param {event} event Event of type variant-changed.
     */
    onVariantChanged: function(event) {
      var product = event.product;
      var variant = event.variant;

      // Update the product price.
      this.productPrice.empty()
        .text(Shopify.formatMoney(variant.price * 100))
        .data('value', variant.price);

      // Update the product image.
      var image = variant.image_id
        ? findInstance(product.images, 'id', variant.image_id)
        : product.image;
      this.productImage.attr('src', image ? image.src : '');

      // Update the product link.
      var url = '/products/' + product.handle + '?variant=' + variant.id;
      this.productLink.attr('href', url);

      this.setLoadedState();
    },

    /**
     * Event handler.
     *
     * @returns {event} Event of type quantity-selected.
     */
    onChangeQuantity: function() {
      this.container.trigger('quantity-selected');
    },

    /**
     * Outputs the current component state as a line item.
     *
     * @returns {object} The line item for this component.
     */
    toLineItem: function() {
      var variant = this.variantSelect.val();
      var quantity = this.quantitySelect.val();
      var price = this.productPrice.data('value');
      return variant ? {
        variant: variant,
        quantity: quantity,
        price: price,
      } : null;
    },

    /**
     * Loads product data via the AJAX API.
     *
     * Data returned from the API is cached for subsequent calls.
     *
     * @param {string} handle The product handle.
     * @returns {event} Event of type product-selected or product-error.
     */
    loadProduct: function(handle) {
      var cache = this.cache;
      var container = this.container;

      if (cache[handle]) {
        container.trigger({
          type: 'product-selected',
          product: cache[handle],
        });
        return;
      }

      this.setLoadingState();

      $.ajax('/products/' + handle + '.json', {
        dataType: 'json',
        success: function(data) {
          var product = data.product;
          cache[handle] = product;
          container.trigger({
            type: 'product-selected',
            product: product,
          });
        },
        error: function() {
          container.trigger('product-error');
        },
      });
    },

    /**
     * Sets the component to its original state.
     */
    setOriginalState: function() {
      this.productOptions.hide();
      this.productDetails.hide();
      this.variantSelect.empty()
        .parent().find(optionSelectorWrapper)
        .remove();
    },

    /**
     * Sets the component state while product data is loading.
     */
    setLoadingState: function() {
      this.productSelect.prop('disabled', true);
      this.productOptions.hide();
      this.productDetails.hide();
    },

    /**
     * Sets the component state after a product has been loaded.
     */
    setLoadedState: function() {
      this.productSelect.prop('disabled', false);
      this.productOptions.show();
      this.productDetails.show();
      this.productUnavailable.hide();
    },

    /**
     * Sets the component state when a variant is not available.
     */
    setStateUnavailable: function() {
      this.productDetails.hide();
      this.productUnavailable.show();
    },

    /**
     * Sets the component state for an AJAX error.
     */
    setErrorState: function() {
      this.productOptions.hide();
      this.productError.show();
    },
  });

  /**
   * Utility function to search an array for a particular object.
   *
   * @param {array} array The array to search.
   * @param {string} key The key to match against.
   * @param {string} value The value to match with.
   * @returns {object|false}
   */
  function findInstance(array, key, value) {
    for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
        return array[i];
      }
    }
    return false;
  }

  return BikeBuilder;
})();
