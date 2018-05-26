<?php
require_once '../vendor/autoload.php';
require_once '../_layout/TemplateRenderer.php';

$renderer = new TemplateRenderer();
print $renderer->render('about/about.twig', array());
?>
