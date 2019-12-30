# frozen_string_literal: true

Rails.application.routes.draw do
  scope '(:locale)', locale: /#{I18n.available_locales.join("|")}/ do
    get 'main/index', as: 'user_root'
    get 'main/mandelbrot' => 'main#mandelbrot', as: 'mandelbrot'
    devise_for :users
    resources :posts
    root 'main#index'
  end
end
