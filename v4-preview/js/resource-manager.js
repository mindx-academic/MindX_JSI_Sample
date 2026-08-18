/* JSI 2026 Optional Extensions V1 - Resource Manager */

(function(window) {
  'use strict';

  var ResourceManager = {
    /**
     * Renders resource list in Task Detail view (Tab Tài Liệu)
     */
    renderResourceList: function(resources, containerEl) {
      if (!containerEl) return;
      containerEl.innerHTML = '';

      if (!resources || resources.length === 0) {
        containerEl.innerHTML = '<div class="tab-placeholder-card"><div class="placeholder-icon">📂</div><p>Nhiệm vụ này chưa có tài liệu đính kèm.</p></div>';
        return;
      }

      var listEl = document.createElement('div');
      listEl.className = 'resource-list-container';

      resources.forEach(function(res) {
        var card = document.createElement('div');
        card.className = 'resource-card';

        var meta = window.ResourceDetector ? window.ResourceDetector.getTypeMeta(res.resourceType) : { label: res.resourceType, symbol: '🔗', iconClass: 'other' };
        var domain = window.ResourceDetector ? window.ResourceDetector.extractDomain(res.url) : 'link';

        var leftHtml = '<div class="resource-info">' +
          '<div class="resource-type-icon ' + meta.iconClass + '">' + meta.symbol + '</div>' +
          '<div class="resource-details">' +
            '<div class="resource-title">' + escapeHtml(res.title) + '</div>' +
            '<div class="resource-domain">' + meta.label + ' • ' + escapeHtml(domain) + '</div>' +
          '</div>' +
        '</div>';

        var rightHtml = '';
        if (res.resourceType === 'image' && res.thumbnailUrl) {
          rightHtml += '<img src="' + escapeHtml(res.thumbnailUrl) + '" class="resource-image-preview" alt="Preview" onerror="this.onerror=null;this.replaceWith(createFallbackIcon());">';
        } else if (res.resourceType === 'image' && res.url) {
          rightHtml += '<img src="' + escapeHtml(res.url) + '" class="resource-image-preview" alt="Preview" onerror="this.onerror=null;this.replaceWith(createFallbackIcon());">';
        }

        rightHtml += '<a href="' + escapeHtml(res.url) + '" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary ms-2"><i class="bi bi-box-arrow-up-right"></i> Mở tab mới</a>';

        card.innerHTML = leftHtml + '<div class="d-flex align-items-center">' + rightHtml + '</div>';
        listEl.appendChild(card);
      });

      containerEl.appendChild(listEl);
    },

    /**
     * Renders Resource Manager inside Teacher Create/Edit Task Form
     */
    renderFormManager: function(resources, containerEl, onUpdateCallback) {
      if (!containerEl) return;
      var currentResources = Array.isArray(resources) ? JSON.parse(JSON.stringify(resources)) : [];

      function refreshForm() {
        containerEl.innerHTML = '';
        var section = document.createElement('div');
        section.className = 'resource-manager-form-section';

        var headerHtml = '<div class="d-flex justify-content-between align-items-center mb-3">' +
          '<h6 class="mb-0 font-weight-bold">Danh sách tài liệu đính kèm (URL-only)</h6>' +
          '<button type="button" class="btn btn-sm btn-outline-danger" id="add-resource-btn" ' + (currentResources.length >= 20 ? 'disabled' : '') + '><i class="bi bi-plus-lg me-1" aria-hidden="true"></i><span>Thêm tài liệu mới</span></button>' +
        '</div>';

        section.innerHTML = headerHtml;
        var listContainer = document.createElement('div');
        listContainer.className = 'resource-inputs-list';

        if (currentResources.length === 0) {
          listContainer.innerHTML = '<p class="text-muted small italic">Chưa đính kèm tài liệu nào.</p>';
        } else {
          currentResources.forEach(function(res, idx) {
            var item = document.createElement('div');
            item.className = 'resource-input-item';

            var itemHtml = '<div class="resource-input-row">' +
              '<input type="text" class="form-control form-control-sm res-title" data-idx="' + idx + '" placeholder="Tiêu đề tài liệu" value="' + escapeHtml(res.title || '') + '">' +
              '<input type="url" class="form-control form-control-sm res-url" data-idx="' + idx + '" placeholder="Đường dẫn URL (https://...)" value="' + escapeHtml(res.url || '') + '">' +
              '<select class="form-select form-select-sm res-type" data-idx="' + idx + '">' +
                renderTypeOptions(res.resourceType) +
              '</select>' +
              '<button type="button" class="btn btn-sm btn-outline-secondary res-delete" data-idx="' + idx + '"><i class="bi bi-trash"></i></button>' +
            '</div>';

            item.innerHTML = itemHtml;
            listContainer.appendChild(item);
          });
        }

        section.appendChild(listContainer);
        containerEl.appendChild(section);

        // Bind events
        var addBtn = section.querySelector('#add-resource-btn');
        if (addBtn) {
          addBtn.onclick = function() {
            if (currentResources.length < 20) {
              currentResources.push({
                resourceId: 'res_' + Date.now(),
                title: '',
                url: '',
                resourceType: 'website',
                description: '',
                order: currentResources.length,
                createdAt: new Date().toISOString()
              });
              refreshForm();
              if (typeof onUpdateCallback === 'function') onUpdateCallback(currentResources);
            }
          };
        }

        section.querySelectorAll('.res-title').forEach(function(input) {
          input.oninput = function(e) {
            var idx = parseInt(e.target.getAttribute('data-idx'), 10);
            currentResources[idx].title = e.target.value;
            if (typeof onUpdateCallback === 'function') onUpdateCallback(currentResources);
          };
        });

        section.querySelectorAll('.res-url').forEach(function(input) {
          input.onchange = function(e) {
            var idx = parseInt(e.target.getAttribute('data-idx'), 10);
            var val = e.target.value;
            currentResources[idx].url = val;
            if (window.ResourceDetector) {
              currentResources[idx].resourceType = window.ResourceDetector.detectType(val);
            }
            refreshForm();
            if (typeof onUpdateCallback === 'function') onUpdateCallback(currentResources);
          };
        });

        section.querySelectorAll('.res-type').forEach(function(select) {
          select.onchange = function(e) {
            var idx = parseInt(e.target.getAttribute('data-idx'), 10);
            currentResources[idx].resourceType = e.target.value;
            if (typeof onUpdateCallback === 'function') onUpdateCallback(currentResources);
          };
        });

        section.querySelectorAll('.res-delete').forEach(function(btn) {
          btn.onclick = function(e) {
            var idx = parseInt(btn.getAttribute('data-idx'), 10);
            currentResources.splice(idx, 1);
            refreshForm();
            if (typeof onUpdateCallback === 'function') onUpdateCallback(currentResources);
          };
        });
      }

      refreshForm();
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderTypeOptions(selectedType) {
    var types = [
      { val: 'google-docs', label: 'Google Docs' },
      { val: 'google-slides', label: 'Google Slides' },
      { val: 'google-sheets', label: 'Google Sheets' },
      { val: 'google-drive', label: 'Google Drive' },
      { val: 'figma', label: 'Figma' },
      { val: 'github', label: 'GitHub' },
      { val: 'image', label: 'Hình ảnh' },
      { val: 'video', label: 'Video' },
      { val: 'website', label: 'Trang web' },
      { val: 'other', label: 'Khác' }
    ];

    return types.map(function(t) {
      var sel = t.val === selectedType ? ' selected' : '';
      return '<option value="' + t.val + '"' + sel + '>' + t.label + '</option>';
    }).join('');
  }

  window.createFallbackIcon = function() {
    var el = document.createElement('div');
    el.className = 'resource-fallback-icon';
    el.innerHTML = '🖼️';
    return el;
  };

  window.ResourceManager = ResourceManager;
})(window);
