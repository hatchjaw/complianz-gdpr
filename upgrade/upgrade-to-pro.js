const rsp_steps = rsp_upgrade.steps;
let rsp_download_link = '';
let rsp_progress_bar = {
	current_step: 1,
	total_steps: rsp_steps.length+1,
	progress_procentage: 0,
	speed: 1,
};

//set up steps html
let rsp_template = document.getElementById('rsp-step-template').innerHTML;
let rsp_total_step_html = '';
rsp_steps.forEach( (step, i) =>	{
	let stepHtml = rsp_template;
	stepHtml = stepHtml.replace('{doing}', step.doing);
	stepHtml = stepHtml.replace('{step}', 'rsp-step-'+i);
	rsp_total_step_html += stepHtml;
});
document.querySelector('.rsp-install-steps').innerHTML = rsp_total_step_html;

const rsp_progress_bar_start = () => {
	rsp_progress_bar['speed'] = 0.25;
	rsp_progress_bar_move();
}

const rsp_progress_bar_finish = () => {
	rsp_progress_bar['speed'] = 1;
}

const rsp_progress_bar_stop = () => {
	rsp_progress_bar['speed'] = 0;
}

const rsp_progress_bar_move = () => {
	let to = rsp_progress_bar.current_step * 100 / rsp_progress_bar.total_steps;
	rsp_progress_bar['progress_procentage'] = Math.min(rsp_progress_bar.progress_procentage + rsp_progress_bar.speed, to);
	let progress_bar_container = document.querySelector(".rsp-progress-bar-container");
	let progress = progress_bar_container.querySelector(".rsp-progress");
	let bar = progress.querySelector(".rsp-bar");
	bar.style = "width: " + rsp_progress_bar.progress_procentage + "%;";

	if ( rsp_progress_bar.speed != 0 && rsp_progress_bar.progress_procentage < to ) {
		setTimeout(rsp_progress_bar_move, 25 / rsp_progress_bar.speed);
	} else {
		if ( rsp_progress_bar.speed == 0 ) {
			bar.style = "width: 100%;";
			bar.classList.remove('rsp-green');
			bar.classList.add('rsp-red');
		} else {
			rsp_progress_bar.current_step++;
		}
	}
}

const rsp_process_step = (current_step) => {
	rsp_progress_bar['current_step'] = current_step;
	let step = rsp_steps[current_step];
	let error = step['error'];
	let success = step['success'];
	rsp_progress_bar_start();

	// Get arguments from url
	const query_string = window.location.search;
	const urlParams = new URLSearchParams(query_string);

	let data = {
		'action': step['action'],
		'token': rsp_upgrade.token,
		'plugin': urlParams.get('plugin'),
		'license': urlParams.get('license'),
		'item_id': urlParams.get('item_id'),
		'api_url': urlParams.get('api_url'),
		'download_link': rsp_download_link,
		'install_pro': true,
	};

	rsp_ajax.get(rsp_upgrade.admin_url, data, function(response) {
		let step_element = document.querySelector(".rsp-step-"+current_step);
		if ( !step_element ) return;

		let step_color = step_element.querySelector(".rsp-step-color");
		let step_text = step_element.querySelector(".rsp-step-text");
		let data = JSON.parse(response);
		if ( data.success ) {
			if ( data.download_link ){
				rsp_download_link = data.download_link;
			}
			step_color.innerHTML = "<div class='rsp-green rsp-bullet'></div>";
			step_text.innerHTML = "<span>"+step.success+"</span>";
			rsp_progress_bar_finish();
			if ( current_step == rsp_steps.length - 1 ) {
				let templateHtml = document.getElementById('rsp-plugin-suggestion-template').innerHTML;
				document.querySelector('.rsp-install-steps').innerHTML = templateHtml;
				document.querySelector('.rsp-install-plugin-modal h3').innerText = rsp_upgrade.finished_title;
				document.querySelector(".rsp-btn.rsp-visit-dashboard").classList.remove("rsp-hidden");
			} else {
				rsp_process_step( current_step+1 );
			}
		} else {
			step_color.innerHTML = "<div class='rsp-red rsp-bullet'></div>";
			if ( data.message ) {
				step.error += '<br>'+data.message;
			}
			step_text.innerHTML = "<span>"+step.error+"</span>";
			rsp_progress_bar_stop();
			document.querySelector(".rsp-btn.rsp-cancel").classList.remove("rsp-hidden");
			document.querySelector(".rsp-error-message").classList.remove("rsp-hidden");
		}
	});
}
rsp_process_step(0);



