# frozen_string_literal: true

# class
class ApplicationController < ActionController::Base
  before_action :set_locale
  def after_sign_out_path_for(_resource_or_scope)
    request.referrer
  end

  private

  def set_locale
    I18n.locale = params[:locale] || I18n.default_locale
  end

  def default_url_options(options = {})
    { locale: I18n.locale }.merge options
  end
end
