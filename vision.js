document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function handleAddItem(event, listId, inputId) {
    if (event.key === 'Enter') {
        addItem(listId, inputId);
    }
}

function addItem(listId, inputId) {
    const list = document.getElementById(listId);
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    
    if (value !== '') {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>${value}</span>
            <div class="dropdown">
                <button class="dropdown-icon"><i class="fas fa-ellipsis-h"></i></button>
                <div class="dropdown-content">
                    <a href="#" onclick="editField(this)"><i class="fas fa-edit"></i> Edit</a>
                    <a href="#" onclick="deleteField(this)"><i class="fas fa-trash"></i> Delete</a>
                </div>
            </div>`;
        list.appendChild(listItem);
        input.value = '';
    }
}

function editField(element) {
    const span = element.closest('li').querySelector('span[contenteditable]');
    span.contentEditable = true;
    span.focus();
    span.onblur = function() {
        span.contentEditable = false;
    };
}

function deleteField(element) {
    const listItem = element.closest('li');
    listItem.remove();
}
