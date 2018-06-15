<?php
// Twig's autoloader will take care of loading required classes
//Twig_Autoloader::register();

class TemplateRenderer
{
    public $loader; // Instance of Twig_Loader_Filesystem
    public $environment; // Instance of Twig_Environment

    public function __construct($envOptions = array(), $templateDirs = array())
    {
        // Merge default options
        // You may want to change these settings
        $envOptions += array(
            'debug' => true,
            'charset' => 'utf-8',
            'cache' => '/tmp/cache', // Store cached files under cache directory
            'strict_variables' => true,
        );
        $templateDirs = array_merge(
            array(__DIR__ . "/../"), // Base directory with all templates
            $templateDirs
        );
        $this->loader = new Twig_Loader_Filesystem($templateDirs);
        $this->environment = new Twig_Environment($this->loader, $envOptions);
    }

    public function render($templateFile, array $variables)
    {
        return $this->environment->render($templateFile, $variables);
    }
}
