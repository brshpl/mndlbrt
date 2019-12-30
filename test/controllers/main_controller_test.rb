# frozen_string_literal: true

require 'test_helper'

class MainControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers
  setup do
    get '/users/sign_in'
    sign_in users(:user_001)
    get root_url
  end
  test 'can get index' do
    get root_url
    assert_response :success
  end
  test 'can get mandelbrot page' do
    get mandelbrot_url
    assert_response :success
  end
  test 'can get posts page' do
    get posts_url
    assert_response :success
  end
end
