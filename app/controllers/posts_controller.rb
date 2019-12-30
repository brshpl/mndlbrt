# frozen_string_literal: true

# class
class PostsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_post, only: %i[show edit update destroy]

  def index
    @posts = Post.order('created_at DESC')
  end

  def show; end

  def new
    @post = Post.new
  end

  def create
    @post = Post.new(post_params)
    if @post.save
      redirect_to posts_path
    else
      render :new
    end
  end

  def edit
    redirect_to posts_path if current_user.email != @post.author
  end

  def update
    if @post.update_attributes(post_params)
      redirect_to post_path(@post)
    else
      render :edit
    end
  end

  def destroy
    @post.destroy
    redirect_to posts_url
  end

  private

  def post_params
    params.require(:post).permit(:author, :image, :remove_image, :image_cache)
  end

  def set_post
    @post = Post.find(params[:id])
  end
end
