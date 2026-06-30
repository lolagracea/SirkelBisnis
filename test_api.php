<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$request = Illuminate\Http\Request::create('/api/products', 'GET', ['supplier_id' => 21]);
$response = app()->handle($request);
echo $response->getContent();
