<?php
require_once './vendor/autoload.php';
require_once './_layout/TemplateRenderer.php';
$news = "test";
$renderer = new TemplateRenderer();
print $renderer->render('index.twig', array('news' => $news));
?>
