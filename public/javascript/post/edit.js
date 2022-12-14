
function editPostSpace(){

// VARIABLES

const secondToLastUrlPath = location.toString().split('/')[location.toString().split('/').length - 2];

const titleStaticEl = $('h5.title');
const contentStaticEl = $('p.content');

const titleEditorEl = $('<input type="text" id="title-editor" class="mt-1 mb-3" />');
const contentEditorEl = $('<textarea id="content-editor" class="mb-2" />');



// FUNCTIONS

function editPostBtnHandler(postId){
    if (secondToLastUrlPath !== 'post'){
        let lastUrlPath = location.toString().split('/')[location.toString().split('/').length - 1];
        const from = lastUrlPath === 'dashboard' ? 'dashboard' : 'home';

        location.replace(`/post/${postId}?edit_now=1&from=${from}`);
        return;
    }

    titleEditorEl.val(titleStaticEl.text());
    contentEditorEl.val(contentStaticEl.html().replaceAll('<br>', '\n'));

    const savePostBtn = $(`<button
        type="button"
        class="save-post-btn btn btn-success mt-2">
        <i class="fa-regular fa-floppy-disk"></i>&nbsp;&nbsp;Update
    </button>`);

    titleStaticEl.remove();
    contentStaticEl.remove();

    $('article.post').removeClass('border bg-light');

    $('.title-wrapper').text('').append(titleEditorEl);
    $('.content-wrapper').append(contentEditorEl);
    $('article.post').append(savePostBtn);
    
    $('article.post .meta').hide();
}


async function savePostBtnHandler(postId){
    const updatedTitleVal = titleEditorEl.val().trim();
    const updatedContentVal = contentEditorEl.val().trim();
    
    if (updatedTitleVal && updatedContentVal){
        const response = await fetch(`/api/post/${postId}`,{
            method: 'put',
            body: JSON.stringify({
                title: updatedTitleVal,
                content: updatedContentVal
            }),
            headers: {'Content-Type': 'application/json'}
        });

        if (response.ok){
            const fromPage = new URLSearchParams(location.search).get('from');
            switch (fromPage) {
                case 'dashboard':
                    location.replace('/dashboard');
                    break;
                case 'home':
                    location.replace('/');
                    break;
                default:
                    location.replace(location.toString().split('?')[0]);
                    break;
                }
        } else if (response.status === 401)
            location.replace(response.headers.get('location'));
        else
            alert(response.statusText);
    }
}



// EVENT LISTENERS

$('article.post').on('click', '.edit-post-btn', function(){
    editPostBtnHandler(+$(this).closest('article.post').attr('post-id'));
});

$('article.post').on('click', '.save-post-btn', async function(){
    await savePostBtnHandler(+$(this).closest('article.post').attr('post-id'));
});



// AUTO-TRIGGER if edit-now attribute === '1'
if (secondToLastUrlPath === 'post' && +$('article.post').attr('edit-now') === 1)
    $('.edit-post-btn').click();

}

editPostSpace();