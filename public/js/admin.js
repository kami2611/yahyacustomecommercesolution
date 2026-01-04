/**
 * Admin Panel JavaScript
 * Vanilla JS for dynamic form injection
 */

// Global attribute counter for unique IDs
let attributeCounter = 0;

/**
 * Initialize Attribute Manager for Category Forms
 * @param {Array} existingAttributes - Pre-existing attributes to load
 */
function initAttributeManager(existingAttributes = []) {
  const container = document.getElementById('attributes-container');
  const addButton = document.getElementById('add-attribute');
  
  if (!container || !addButton) return;
  
  // Load existing attributes
  if (existingAttributes && existingAttributes.length > 0) {
    existingAttributes.forEach(attr => {
      addAttributeRow(container, attr);
    });
  }
  
  // Add button click handler
  addButton.addEventListener('click', () => {
    addAttributeRow(container);
  });
}

/**
 * Add a new attribute row to the form
 * @param {HTMLElement} container - Container element
 * @param {Object} data - Existing attribute data (optional)
 */
function addAttributeRow(container, data = {}) {
  const index = attributeCounter++;
  const row = document.createElement('div');
  row.className = 'attribute-row';
  row.id = `attribute-row-${index}`;
  
  const optionsValue = data.options ? 
    (Array.isArray(data.options) ? data.options.join(', ') : data.options) : '';
  
  row.innerHTML = `
    <div class="attribute-row-header">
      <strong>Attribute #${index + 1}</strong>
      <button type="button" class="btn-remove-attr" onclick="removeAttributeRow(${index})" title="Remove attribute">
        &times;
      </button>
    </div>
    <div class="attribute-fields">
      <div class="form-group">
        <label>Label *</label>
        <input type="text" name="attributes[${index}][label]" class="form-control" 
               placeholder="e.g., Brand" value="${data.label || ''}" required>
      </div>
      <div class="form-group">
        <label>Key</label>
        <input type="text" name="attributes[${index}][key]" class="form-control" 
               placeholder="e.g., brand" value="${data.key || ''}">
      </div>
      <div class="form-group">
        <label>Field Type</label>
        <select name="attributes[${index}][fieldType]" class="form-control" 
                onchange="toggleOptionsField(${index}, this.value)">
          <option value="text" ${data.fieldType === 'text' ? 'selected' : ''}>Text</option>
          <option value="number" ${data.fieldType === 'number' ? 'selected' : ''}>Number</option>
          <option value="select" ${data.fieldType === 'select' ? 'selected' : ''}>Select/Dropdown</option>
        </select>
      </div>
      <div class="form-group options-container ${data.fieldType === 'select' ? 'visible' : ''}" 
           id="options-container-${index}">
        <label>Options (comma-separated)</label>
        <input type="text" name="attributes[${index}][options]" class="form-control" 
               placeholder="e.g., Option 1, Option 2, Option 3" value="${optionsValue}">
      </div>
    </div>
  `;
  
  container.appendChild(row);
}

/**
 * Remove an attribute row
 * @param {number} index - Row index to remove
 */
function removeAttributeRow(index) {
  const row = document.getElementById(`attribute-row-${index}`);
  if (row) {
    row.remove();
  }
}

/**
 * Toggle options field visibility based on field type
 * @param {number} index - Attribute row index
 * @param {string} fieldType - Selected field type
 */
function toggleOptionsField(index, fieldType) {
  const optionsContainer = document.getElementById(`options-container-${index}`);
  if (optionsContainer) {
    if (fieldType === 'select') {
      optionsContainer.classList.add('visible');
    } else {
      optionsContainer.classList.remove('visible');
    }
  }
}

/**
 * Initialize Product Form with Dynamic Attribute Fetching
 * @param {Object} existingMetadata - Pre-existing metadata values (for edit form)
 */
function initProductForm(existingMetadata = {}) {
  const categorySelect = document.getElementById('category');
  const metadataContainer = document.getElementById('metadata-container');
  const metadataFields = document.getElementById('metadata-fields');
  
  if (!categorySelect || !metadataContainer || !metadataFields) return;
  
  // Category change handler - fetch attributes via AJAX
  categorySelect.addEventListener('change', async function() {
    const categoryId = this.value;
    
    if (!categoryId) {
      metadataContainer.style.display = 'none';
      metadataFields.innerHTML = '';
      return;
    }
    
    // Show loading state
    metadataFields.innerHTML = '<div class="loading"></div> Loading attributes...';
    metadataContainer.style.display = 'block';
    
    try {
      // Fetch category attributes (including inherited)
      const response = await fetch(`/api/categories/${categoryId}/attributes`);
      const data = await response.json();
      
      if (data.success && data.attributes && data.attributes.length > 0) {
        renderMetadataFields(data.attributes, existingMetadata);
      } else {
        metadataContainer.style.display = 'none';
        metadataFields.innerHTML = '';
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
      metadataFields.innerHTML = '<p class="error">Error loading attributes</p>';
    }
  });
  
  // Trigger initial load if category is pre-selected (edit form)
  if (categorySelect.value && Object.keys(existingMetadata).length === 0) {
    // Don't trigger on edit form if we already have server-rendered fields
    const existingFields = metadataFields.querySelectorAll('.metadata-field');
    if (existingFields.length === 0) {
      categorySelect.dispatchEvent(new Event('change'));
    }
  }
}

/**
 * Render metadata input fields based on fetched attributes
 * @param {Array} attributes - Array of attribute definitions
 * @param {Object} existingMetadata - Existing values to populate
 */
function renderMetadataFields(attributes, existingMetadata = {}) {
  const container = document.getElementById('metadata-fields');
  container.innerHTML = '';
  
  attributes.forEach(attr => {
    const value = existingMetadata[attr.key] || '';
    const div = document.createElement('div');
    div.className = 'form-group metadata-field';
    
    // Create label
    let labelHtml = `<label for="metadata_${attr.key}">${attr.label}`;
    if (attr.inheritedFrom) {
      labelHtml += ` <span class="inherited-badge">from ${attr.inheritedFrom}</span>`;
    }
    labelHtml += '</label>';
    
    // Create input based on field type
    let inputHtml = '';
    
    switch (attr.fieldType) {
      case 'select':
        inputHtml = `<select id="metadata_${attr.key}" name="metadata[${attr.key}]" class="form-control">
          <option value="">-- Select --</option>`;
        if (attr.options && Array.isArray(attr.options)) {
          attr.options.forEach(opt => {
            const selected = value === opt ? 'selected' : '';
            inputHtml += `<option value="${escapeHtml(opt)}" ${selected}>${escapeHtml(opt)}</option>`;
          });
        }
        inputHtml += '</select>';
        break;
        
      case 'number':
        inputHtml = `<input type="number" id="metadata_${attr.key}" name="metadata[${attr.key}]" 
                     class="form-control" value="${escapeHtml(value)}">`;
        break;
        
      default: // text
        inputHtml = `<input type="text" id="metadata_${attr.key}" name="metadata[${attr.key}]" 
                     class="form-control" value="${escapeHtml(value)}">`;
    }
    
    div.innerHTML = labelHtml + inputHtml;
    container.appendChild(div);
  });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Auto-generate slug from name
document.addEventListener('DOMContentLoaded', function() {
  const nameInput = document.getElementById('name');
  const slugInput = document.getElementById('slug');
  
  if (nameInput && slugInput && !slugInput.value) {
    nameInput.addEventListener('input', function() {
      if (!slugInput.dataset.manual) {
        slugInput.value = this.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
    });
    
    slugInput.addEventListener('input', function() {
      this.dataset.manual = this.value ? 'true' : '';
    });
  }
});

/**
 * Remove existing image from product
 * @param {HTMLElement} button - The remove button element
 * @param {number} index - Image index
 */
function removeExistingImage(button, index) {
  const preview = button.closest('.image-preview');
  const hiddenInput = preview.querySelector('input[name="existingImages"]');
  
  if (preview.classList.contains('removed')) {
    // Re-add the image
    preview.classList.remove('removed');
    if (hiddenInput) {
      hiddenInput.disabled = false;
    }
    button.innerHTML = '×';
    button.title = 'Remove image';
  } else {
    // Mark for removal
    preview.classList.add('removed');
    if (hiddenInput) {
      hiddenInput.disabled = true;
    }
    button.innerHTML = '↺';
    button.title = 'Restore image';
  }
}

/**
 * Preview selected images before upload
 */
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('images');
  
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      // Remove any existing preview
      const existingPreview = document.querySelector('.new-images-preview');
      if (existingPreview) {
        existingPreview.remove();
      }
      
      if (this.files && this.files.length > 0) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'new-images-preview';
        previewContainer.innerHTML = '<p style="margin: 10px 0 5px; font-weight: 500;">New images to upload:</p>';
        
        const previewGrid = document.createElement('div');
        previewGrid.className = 'current-images';
        
        Array.from(this.files).forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview ${index + 1}">`;
            previewGrid.appendChild(preview);
          };
          reader.readAsDataURL(file);
        });
        
        previewContainer.appendChild(previewGrid);
        this.parentNode.appendChild(previewContainer);
      }
    });
  }
});
