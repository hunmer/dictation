$(function() {
	new ClipboardJS('#clipboard');

	window.history.pushState(null, null, "#");
	window.addEventListener("popstate", function(event) {
		window.history.pushState(null, null, "#");
		event.preventDefault(true);
		event.stopPropagation();
		//$('#modal1').modal('close');
	});
	$(window).scroll(function() {
		return;
	    var scrollTop = $(this).scrollTop();
	    var i = $(document).height() - (scrollTop + $(this).height());
	    if (i <= 30) {
	        //滚动条到达底部
	        if (!$('#pose-search').hasClass('hide')) {
	            var now = new Date().getTime() / 1000;
	            if (!g_b_loading && now - g_i_loading_last >= 3) {
	                g_i_loading_last = now;
	                g_b_loading = true;
	                g_v_poseSearch.page++;
	            }
	        }
	    } else if (scrollTop <= 0) {//滚动条到达顶部
	    }
	});	

	$(document).on('click', '[data-action]', function(event) {
		// event.preventDefault();
		var dom = $(this);
		console.log(dom.attr('data-action'));
		switch(dom.attr('data-action')){
			case 'sendMsg':
				var parent = dom.parents('.card');
				var input = parent.find('textarea');
				var val = input.val();
				if(val == ''){
					setFormTip(input, false);
				}else{
					setFormTip(input, true);


					$.post(g_s_api, {
						user: g_config.user,
						list: g_config.lastList,
						fid: parent.attr('data-fid'),
						text: val,
						action: 'set'
					}, function(data, textStatus, xhr) {
						if(textStatus == 'success' && data == '1'){
							input.val('');
							parent.find('.comment_area').append(getCommentHtml(g_config.user, getNow(), val));
		 					hsycms.success('success', '送信成功');
						}else{
		 					hsycms.error('error', '送信失敗');
						}
					});

				}
				break;
			case 'deleteMsg':
				var parent = dom.parents('.card');
				var dom_msg = dom.parents('.msg');
				confirm('消去してもよろしいですか？', {
					ok: function(){
						$.post(g_s_api, {
							user: g_config.user,
							list: g_config.lastList,
							fid: parent.attr('data-fid'),
							time: dom_msg.attr('data-time'),
							action: 'del'
						}, function(data, textStatus, xhr) {
							if(textStatus == 'success' && data == '1'){
								dom_msg.remove();
			 					hsycms.success('success', '削除されました');
							}else{
			 					hsycms.error('error', 'error');
							}
						});
					}

				})
				break;

			case 'copyMsg':
				setCopyText(dom.parents('.list-group-item').find('.msg_content').html());
				break;

			case 'inputText':
				dom.parents('.card').find('textarea').val(dom.parents('.list-group-item').find('.msg_content').html()).focus();
				break;

			case 'unknow':
				dom.parents('.card').find('textarea').val('分からない').focus();
				break;

			case 'switchAudio':
				var audio = dom.next('audio')[0];
				if(audio.paused){
					dom.attr('src', './img/audio-wave.gif')
					audio.play();
				}else{
					audio.pause();
					dom.attr('src', './img/audio-wave.png')
				}
				break;
		}
	});

	loadData();
});

function setCopyText(text){
	$('#clipboard_content').val(text);
	$('#modal_copy').modal('show');
}

function confirm(text, params = {
	ok: function(){},
	cancel: function(){},
	ok_text: 'done',
	cancel_text: 'cancel'
}){
  hsycms.confirm('confirm',text,
     function(res){       
     	params.ok();     
       hsycms.success('success',params.ok_text);
     },
    function(res){
    	console.log(params);
    	params.cancel();
        hsycms.error('error',params.cancel_text);
     },
  )
}

function getCommentHtml(user, time, msg){
	return `<a class="list-group-item list-group-item-action flex-column align-items-start msg" data-time="`+time+`"><div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">
          <img class="round" src="./img/`+user+`.jpg" width="30px" height="30px">
          <small class="ml-1">`+g_datas.user[user].name+`</small>
        </h5>
        <small>`+getTimeString(getNow() - time)+`</small>
      </div>
      <p class="mb-1 msg_content">`+msg+`</p>
      <div class="icon_list float-right">
       `+ (g_config.user == 'maki' || user == g_config.user ? g_res.svg_trash+` | ` : '')+g_res.svg_clipboard+` | `+g_res.svg_card+`
      </div></a>`;
}

function loadData(){
	$.getJSON(g_s_api, {t: new Date().getTime()}, function(json, textStatus) {
		g_datas = json;
		checkLogin();
		initData();
	});
}

function initData(){
	for(let d in g_datas.list){
		$('#list .dropdown-menu').append('<a class="dropdown-item" href="javascript: selectList(`'+d+'`)">'+d+'</a>');
		if(d == g_config.lastList){
			selectList(d);
		}
	}

}

function selectList(s_list){
	g_config.lastList = s_list;
	local_saveJson('config', g_config);

	$('#list_name').html(s_list);
	var res = g_datas.list[s_list];
	var svg_comment = g_res.svg_comment;
	
	var h = '';
	for(let d in res){
		h = h + `
 <div class="card mt-3" data-fid="`+d+`">
      <div class="card-header">
        `+d+`
      </div>
      <div class="card-body">
          <div class="audio_show text-center">
            <img class="mb-2" src="./img/audio-wave.png" width="50px" height="50px" data-action="switchAudio">
			<audio src="`+g_s_audio_path+`/audio/`+s_list+`/`+d+`.wav" ontimeupdate="audio_timeUpdate(this)" onended="$(this).prev().attr('src', './img/audio-wave.png')"></audio>
            <div class="progress mb-2">
              <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div>
            </div>
          </div>
              <div class="list-group comment_area">`;
         	for(let comment of res[d].comments){
            	h = h + getCommentHtml(comment.user, comment.time, comment.text)
            }

        h = h + `</div></p>
        <div class="comment">
                   <div class="form-group text-center">
                    <label for="input_msg_`+d+`">
                    `+svg_comment+`
                    </label>
                    <textarea id="input_msg_`+d+`" class="form-control input_comment" onkeydown="if(event.keyCode==13 && event.ctrlKey) $(this).parents('.card').find('[data-action=sendMsg]')[0].click();"></textarea>
                  </div>
                  <button class="btn btn-primary float-right ml-3" data-action="sendMsg">発信</button>
                  <button class="btn btn-secondary float-right" data-action="unknow">分かんない</button>
                </div>

      </div>
      <div class="card-footer text-right">
        `+getTimeString(getNow() - d.time)+`
      </div>
    </div>`;
	}
	$('#card_list').html(h);
}

function audio_timeUpdate(audio){
	var progress = Math.round(audio.currentTime / audio.duration * 100);
	if(progress == 100) progress = 0;
	$(audio).parent().find('.progress-bar').css('width', progress + '%');
}

function showUI(id) {
    $('.container').each(function(index, el) {
        if (el.id == id) {
            $(el).removeClass('hide');
        } else {
            $(el).addClass('hide');
        }
    });
}

function setFormTip(dom, success = false, tip = ''){
	dom.removeClass('is-valid').removeClass('is-invalid');
	dom.addClass(success ? 'is-valid' : 'is-invalid').next(success ? '.valid-feedback' : '.invalid-feedback').html(tip);
}

function checkUser(){
	var dom = $('#input_user');
	var val = dom.val();
	if(g_datas.user[val] != undefined){
		$('.container').show();
		setUser(val);
		 hsycms.success('success', '暗号正解！');
        setFormTip(dom, true, '暗号正解！');

        initData();
        setTimeout(function(){
        	$('#modal_user').modal('hide');
        })
	}else{
        hsycms.error('error','暗号無効！');
        setFormTip(dom, false, '暗号無効！');
	}
}

function setUser(user){
		g_config.user = user;
		if(!user) user = 'default;'
		local_saveJson('config', g_config);
		var brand = $('.navbar-brand');
        brand.find('span').html(user == 'default;' ? '' : g_datas.user[user].name);
		brand.find('img').attr('src', user == 'default;' ? './img/default.png' : g_datas.user[user].icon);
}

function loginOut(){
	setUser();
	checkLogin();
}

function checkLogin(){
	if(!g_config.user){
		$('.container').hide();
		$('#modal_user').modal({
			backdrop: 'static',
			keyboard: false
		}).modal('show');
		return;
	}else{
		$('.container').show();
		setUser(g_config.user);
	}
}