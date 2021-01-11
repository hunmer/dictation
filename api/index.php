<?php
	header('Access-Control-Allow-Origin: *');
	ini_set("display_errors","On");
	error_reporting(E_ALL);
	if(!file_exists('res.json')){
		$json = [
			'user' => [
				'maki' => [
					'name' => 'まき',
					'icon' => './img/maki.jpg',
				],
				'chisato' => [
					'name' => 'ちさと',
					'icon' => './img/chisato.jpg',
				],
			],
			'list' => [
				/*'test1' => [
					'10' => [
						'comments' => [],
						'time' => 1610359260,
					]
				],*/
			]
		];
		saveRes($json);
	}else{
		$json = json_decode(file_get_contents('res.json'), true);
	}
	if(count($_POST) == 0){
		echo json_encode($json);
		exit();
	}
	$user = $_POST['user'];
	if(!isset($json['user'][$user])){
		exit();
	}
	$list_key = $_POST['list'];
	$list_subKey = $_POST['fid'];
	switch($_POST['action']){
		case 'set':
			if(isset($json['list'][$list_key][$list_subKey])){
				$json['list'][$list_key][$list_subKey]['comments'][] = [
					'user' => $user,
					'time' => intval(microtime(true)),
					'text' => $_POST['text']
				];
				saveRes($json);
				echo 1;
				exit();
			}
			break;

		case 'del':
			if(isset($json['list'][$list_key][$list_subKey])){

				foreach($json['list'][$list_key][$list_subKey]['comments'] as $k => $comment){
					if($comment['time'] == $_POST['time']){
						unset($json['list'][$list_key][$list_subKey]['comments'][$k]);
						$json['list'][$list_key][$list_subKey]['comments'] = array_values($json['list'][$list_key][$list_subKey]['comments']);
						saveRes($json);
						echo 1;
						exit();
					}
				}
			}
			break;
	}

	function saveRes($json){
		file_put_contents('res.json', json_encode($json));
	}

