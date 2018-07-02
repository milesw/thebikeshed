/**
 * Bike Decal Form component.
 *
 * Adds interaction to the form, including a live preview.
 *
 * Dependencies: jQuery
 *
 * @see snippets/product-template.liquid
 */
theme.BikeDecalForm = (function() {

  /**
   * Constructor.
   *
   * @param {object} container
   */
  function BikeDecalForm(container) {
    this.container = $(container);
    this.checkboxToggle = this.container.find('[data-toggle]');
    this.formFields = this.container.find('[data-fields]');
    this.colorSelect = this.container.find('[data-color]');
    this.textInput = this.container.find('[data-text]');
    this.previewBox = this.container.find('[data-preview]');
    this.init();
  }

  BikeDecalForm.prototype = $.extend({}, BikeDecalForm.prototype, {

    /**
     * Initializes the component.
     */
    init: function() {
      this.updateState();
      this.updateColor();
      this.updateText();
      this.events();

      // Store the name attributes so we can toggle the form on
      // and off. Otherwise lingering values will be included
      // in the line item.
      this.colorSelect.data('name', this.colorSelect.attr('name'));
      this.textInput.data('name', this.textInput.attr('name'));
    },

    /**
     * Event binding.
     */
    events: function() {
      this.checkboxToggle.on('change', this.updateState.bind(this));
      this.colorSelect.on('change', this.updateColor.bind(this));
      this.textInput.on('keyup', this.updateText.bind(this));
    },

    /**
     * Updates the preview text color.
     */
    updateColor: function() {
      this.previewBox.css('color', this.colorSelect.val());
    },

    /**
     * Updates the preview text.
     */
    updateText: function() {
      this.previewBox.text(this.textInput.val());
    },

    /**
     * Enables or disables the form based on the checkbox.
     */
    updateState: function() {
      if (this.checkboxToggle.prop('checked') === true) {
        this.enableForm();
      } else {
        this.disableForm();
      }
    },

    /**
     * Disables the form.
     */
    disableForm: function() {
      // Remove the name property so entered values don't get added as line
      // item properties.
      this.colorSelect.removeAttr('name');
      this.textInput.removeAttr('name').removeAttr('required');
      this.checkboxToggle.val('No');
      this.formFields.hide();
    },

    /**
     * Re-enables the form.
     */
    enableForm: function() {
      // Restore the name attribute we saved previously.
      this.colorSelect.attr('name', this.colorSelect.data('name'));
      this.textInput.attr('name', this.textInput.data('name'))
        .attr('required', true);
      this.checkboxToggle.val('Yes');
      this.formFields.show();
    },
  });

  return BikeDecalForm;
})();
