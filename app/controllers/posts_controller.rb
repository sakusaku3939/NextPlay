class PostsController < ApplicationController
  before_action :set_post, only: %i[ show edit update destroy ]
  before_action :authenticate_user!, except: [:show, :index]

  # GET /posts or /posts.json
  def index
    @posts = Post.all.reverse
    @streams = Stream.all.reverse
  end

  # GET /posts/1 or /posts/1.json
  def show
  end

  # GET /posts/new
  def new
    @post = Post.new
  end

  # GET /posts/1/edit
  def edit
  end

  # POST /posts or /posts.json
  def create
    # Streamがthumbnailを持っている場合のみ作成
    if params[:post][:thumbnail].present? && !session["room_id"].blank?
      @stream = Stream.new(room_id: session["room_id"],
                           profile_id: params[:post][:profile_id],
                           username: Profile.find(params[:post][:profile_id]).username,
                           thumbnail: params[:post][:thumbnail])
      if @stream.save
        # Streamが保存されたら、そのIDをPostに格納
        @post = Post.new(post_params.merge(stream_id: @stream.id))
        session["room_id"] = ""
      else
        respond_to do |format|
          format.html { render :new, status: :unprocessable_entity }
          format.json { render json: @post.errors, status: :unprocessable_entity }
        end
        return
      end
    else
      # thumbnailがない場合は、StreamのIDなしでPostを作成
      @post = Post.new(post_params)
    end

    # Postの保存
    respond_to do |format|
      if @post.save
        format.html { redirect_to root_url, notice: "Post was successfully created." }
        format.json { render :show, status: :created, location: @post }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /posts/1 or /posts/1.json
  def update
    respond_to do |format|
      if @post.update(post_params)
        format.html { redirect_to post_url(@post), notice: "Post was successfully updated." }
        format.json { render :show, status: :ok, location: @post }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /posts/1 or /posts/1.json
  def destroy
    @post.destroy!

    respond_to do |format|
      format.html { redirect_to posts_url, notice: "Post was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_post
    @post = Post.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def post_params
    params.require(:post).permit(:profile_id, :content, :stream_id, :is_comment)
  end
end
